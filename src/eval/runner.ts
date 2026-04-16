import { HumanMessage, AIMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { freshDB, snapshotDB } from "./db.js";
import { runAgent, trajectoryAsText } from "./agent.js";
import { ironUserReply, isConversationDone } from "./ironUser.js";
import { stateGrader } from "./graders/stateGrader.js";
import { policyGrader } from "./graders/policyGrader.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import type { EvalTask, Trajectory, Step } from "./types.js";

// ── Single-turn runner ──

export async function runSingleTurn(
  tasks: EvalTask[]
): Promise<Record<string, Trajectory>> {
  const results: Record<string, Trajectory> = {};

  console.log("\n=== Single-turn run ===\n");
  for (const task of tasks) {
    freshDB();
    const { trajectory } = await runAgent(task.query, task.id);
    results[task.id] = trajectory;
    const nActions = trajectory.steps.filter((s) => s.type === "action").length;
    const resp = trajectory.final_response.slice(0, 70);
    console.log(`  ${task.id}: actions=${nActions}  ${resp}...`);
  }

  printGraderResults(tasks, results);
  return results;
}

// ── Multi-turn runner with Iron User v2 ──

export async function runMultiTurn(
  tasks: EvalTask[],
  maxTurns = 5,
  maxSteps = 30
): Promise<Record<string, Trajectory>> {
  const results: Record<string, Trajectory> = {};

  console.log("\n=== Multi-turn run (Iron User v2) ===\n");
  for (const task of tasks) {
    process.stdout.write(`  ${task.id}... `);
    freshDB();

    const messages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(task.query),
    ];
    let { trajectory, messages: agentMessages } = await runAgent(task.query, task.id, messages);

    // If task doesn't need dialogue, we're done
    if (!task.scenario || !task.needs_dialogue) {
      results[task.id] = trajectory;
      console.log(`done (${trajectory.steps.length} steps)`);
      continue;
    }

    // Iron User conversation for dialogue tasks
    const ironConversation: BaseMessage[] = [new HumanMessage(task.query)];
    if (trajectory.final_response) {
      ironConversation.push(new AIMessage(trajectory.final_response));
    }

    for (let turn = 0; turn < maxTurns; turn++) {
      if (!trajectory.final_response || trajectory.steps.length >= maxSteps) break;

      const userReply = await ironUserReply(task, ironConversation);
      trajectory.steps.push({ type: "response", content: `[USER] ${userReply}` });

      if (isConversationDone(userReply)) break;

      agentMessages.push(new HumanMessage(userReply));
      ironConversation.push(new HumanMessage(userReply));

      // Re-invoke agent with full message history
      const result = await runAgent(task.query, task.id, agentMessages);
      agentMessages = result.messages;

      // Append new steps (skip messages we already recorded)
      for (const msg of result.messages) {
        if (msg instanceof AIMessage) {
          if (msg.tool_calls?.length) {
            for (const tc of msg.tool_calls) {
              trajectory.steps.push({
                type: "action",
                content: { tool: tc.name, args: tc.args },
              });
            }
          } else if (msg.content && msg.content !== trajectory.final_response) {
            trajectory.steps.push({ type: "response", content: msg.content });
            trajectory.final_response = msg.content as string;
            ironConversation.push(new AIMessage(msg.content as string));
          }
        } else if (msg instanceof ToolMessage) {
          trajectory.steps.push({
            type: "observation",
            content: (msg.content as string).slice(0, 500),
          });
        }
      }
    }

    trajectory.db_after = snapshotDB();
    results[task.id] = trajectory;
    console.log(`done (${trajectory.steps.length} steps)`);
  }

  printGraderResults(tasks, results);
  return results;
}

// ── Print grader results table ──

function printGraderResults(tasks: EvalTask[], results: Record<string, Trajectory>): void {
  console.log(`\n${"=".repeat(75)}`);
  console.log("=== Results: state + policy checks ===\n");
  console.log(
    `${"ID".padEnd(6)} ${"Diff".padEnd(7)} ${"Actions".padEnd(8)} ` +
    `${"State".padEnd(6)} ${"Policy".padEnd(7)} ${"Response".padEnd(40)}`
  );
  console.log("-".repeat(75));

  for (const task of tasks) {
    const t = results[task.id];
    if (!t) continue;
    const sg = stateGrader(t, task.expected_state_changes, task.validation_rule);
    const pg = policyGrader(t, task.policies_to_check);
    const nAct = t.steps.filter((s) => s.type === "action").length;
    const resp = t.final_response.slice(0, 38);

    console.log(
      `  ${task.id.padEnd(4)} ${task.difficulty.padEnd(7)} ${String(nAct).padEnd(8)} ` +
      `${(sg.pass ? "PASS" : "FAIL").padEnd(6)} ` +
      `${(pg.pass ? "PASS" : "FAIL").padEnd(7)} ${resp}`
    );
  }

  // Summary stats
  const dialogueTasks = tasks.filter((t) => t.needs_dialogue);
  const stateTasks = tasks.filter((t) => t.expected_state_changes);
  const statePass = stateTasks.filter((t) => {
    const tr = results[t.id];
    return tr && stateGrader(tr, t.expected_state_changes, t.validation_rule).pass;
  }).length;

  console.log(`\n  Dialogue tasks: ${dialogueTasks.length}`);
  console.log(`  State checks: ${statePass}/${stateTasks.length} passed`);
}
