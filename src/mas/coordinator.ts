import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../agent/llm.js";
import {
  CoordinatorPlanSchema,
} from "../agent/schemas.js";
import type { SubTask, CoordinatorPlan, AgentResult } from "../agent/schemas.js";
import { SpecializedAgent } from "./specialistAgent.js";
import {
  COORDINATOR_PLANNING_PROMPT,
  COORDINATOR_SYNTHESIS_PROMPT,
} from "./prompts.js";

const planningLlm = llm.withStructuredOutput(CoordinatorPlanSchema);

export class CoordinatorAgent {
  protected agents: Record<string, SpecializedAgent>;
  protected synthesisLlm = llm;

  constructor(specialistAgents: Record<string, SpecializedAgent>) {
    this.agents = specialistAgents;
  }

  async createPlan(userQuery: string): Promise<CoordinatorPlan> {
    return planningLlm.invoke([
      new SystemMessage(COORDINATOR_PLANNING_PROMPT),
      new HumanMessage(userQuery),
    ]);
  }

  async executePlan(plan: CoordinatorPlan): Promise<AgentResult[]> {
    const results: AgentResult[] = [];
    const sortedTasks = [...plan.subtasks].sort(
      (a: SubTask, b: SubTask) => a.priority - b.priority
    );

    // Group tasks by priority for parallel execution within the same level
    const groups: SubTask[][] = [];
    let currentPriority = -1;
    for (const task of sortedTasks) {
      if (task.priority !== currentPriority) {
        groups.push([]);
        currentPriority = task.priority;
      }
      groups[groups.length - 1].push(task);
    }

    for (const group of groups) {
      const groupResults = await Promise.all(
        group.map(async (task) => {
          const agent = this.agents[task.agent_name];
          if (!agent) {
            return {
              agent_name: task.agent_name,
              status: "error" as const,
              result: `Agent '${task.agent_name}' not found`,
              tools_used: [],
            };
          }

          console.log(`  [${task.agent_name}] ${task.description}`);
          const result = await agent.process(task.description);
          console.log(`  -> ${result.status} (tools: ${result.tools_used})`);
          return result;
        })
      );
      results.push(...groupResults);
    }

    return results;
  }

  async synthesize(
    userQuery: string,
    results: AgentResult[]
  ): Promise<string> {
    const resultsText = results
      .map((r) => `[${r.agent_name}] (${r.status}):\n${r.result}`)
      .join("\n\n");

    const response = await this.synthesisLlm.invoke([
      new SystemMessage(COORDINATOR_SYNTHESIS_PROMPT),
      new HumanMessage(
        `Customer request: ${userQuery}\n\nSpecialist results:\n${resultsText}`
      ),
    ]);
    return response.content as string;
  }

  async processQuery(
    userQuery: string
  ): Promise<{ answer: string; results: AgentResult[] }> {
    console.log(`\n${"=".repeat(60)}`);
    console.log("COORDINATOR: processing query");
    console.log("=".repeat(60));

    console.log("\n[Step 1] Planning...");
    const plan = await this.createPlan(userQuery);
    console.log(`  Reasoning: ${plan.reasoning}`);
    console.log(`  Tasks: ${plan.subtasks.length}`);

    console.log("\n[Step 2] Delegating to specialists...");
    const results = await this.executePlan(plan);

    console.log("\n[Step 3] Synthesizing final answer...");
    const answer = await this.synthesize(userQuery, results);

    console.log(`\n${"=".repeat(60)}`);
    console.log("FINAL ANSWER:");
    console.log("=".repeat(60));
    console.log(answer);

    return { answer, results };
  }
}
