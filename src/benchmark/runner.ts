import { randomUUID } from "crypto";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { TEST_QUERIES } from "./queries.js";
import { scoreResponse } from "./scorer.js";
import { printReport } from "./report.js";

import { app } from "../agent/graph.js";
import { CoordinatorAgent } from "../mas/coordinator.js";
import { EnhancedCoordinator } from "../mas/enhancedCoordinator.js";
import { createSpecialists } from "../mas/index.js";

export interface BenchmarkResult {
  architecture: string;
  query: string;
  response: string;
  executionTime: number;
  llmCalls: number;
  toolCalls: number;
  success: boolean;
  factScore: number;
  factsFound: string[];
  factsMissed: string[];
}

function countMessages(messages: unknown[]): { llmCalls: number; toolCalls: number } {
  let llmCalls = 0;
  let toolCalls = 0;
  for (const m of messages as any[]) {
    if (m instanceof AIMessage) {
      llmCalls++;
      if (m.tool_calls?.length) {
        toolCalls += m.tool_calls.length;
      }
    }
  }
  return { llmCalls, toolCalls };
}

async function runSingleAgent(tq: (typeof TEST_QUERIES)[number]): Promise<BenchmarkResult> {
  const start = Date.now();
  const config = { configurable: { thread_id: randomUUID() } };
  const result = await app.invoke({
    messages: [new HumanMessage(tq.query)],
  }, config);
  const elapsed = (Date.now() - start) / 1000;
  const { llmCalls, toolCalls } = countMessages(result.messages);
  const responseText = result.messages[result.messages.length - 1].content as string;
  const { score, found, missed } = scoreResponse(responseText, tq.complexity);

  return {
    architecture: "Single Agent",
    query: tq.query,
    response: responseText,
    executionTime: elapsed,
    llmCalls,
    toolCalls,
    success: true,
    factScore: score,
    factsFound: found,
    factsMissed: missed,
  };
}

async function runMAS(tq: (typeof TEST_QUERIES)[number]): Promise<BenchmarkResult> {
  const start = Date.now();
  const specialists = createSpecialists();
  const coordinator = new CoordinatorAgent(specialists);
  const { answer, results } = await coordinator.processQuery(tq.query);
  const elapsed = (Date.now() - start) / 1000;

  const totalTools = results.reduce((s, r) => s + r.tools_used.length, 0);
  const { score, found, missed } = scoreResponse(answer, tq.complexity);

  return {
    architecture: "Hierarchical MAS",
    query: tq.query,
    response: answer,
    executionTime: elapsed,
    llmCalls: results.length + 2,
    toolCalls: totalTools,
    success: true,
    factScore: score,
    factsFound: found,
    factsMissed: missed,
  };
}

async function runMASCritic(tq: (typeof TEST_QUERIES)[number]): Promise<BenchmarkResult> {
  const start = Date.now();
  const specialists = createSpecialists();
  const coordinator = new EnhancedCoordinator(specialists);
  const { answer, results } = await coordinator.processQueryWithQC(tq.query);
  const elapsed = (Date.now() - start) / 1000;

  const totalTools = results.reduce((s, r) => s + r.tools_used.length, 0);
  const { score, found, missed } = scoreResponse(answer, tq.complexity);

  return {
    architecture: "MAS + Critic",
    query: tq.query,
    response: answer,
    executionTime: elapsed,
    llmCalls: results.length + 3,
    toolCalls: totalTools,
    success: true,
    factScore: score,
    factsFound: found,
    factsMissed: missed,
  };
}

export async function runBenchmark(): Promise<void> {
  const allResults: BenchmarkResult[] = [];

  const architectures: Array<{
    name: string;
    run: (tq: (typeof TEST_QUERIES)[number]) => Promise<BenchmarkResult>;
  }> = [
    { name: "Single Agent (ReAct)", run: runSingleAgent },
    { name: "Hierarchical MAS", run: runMAS },
    { name: "MAS + Critic", run: runMASCritic },
  ];

  for (const arch of architectures) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`BENCHMARKING: ${arch.name}`);
    console.log("=".repeat(60));

    for (const tq of TEST_QUERIES) {
      console.log(`\n  Query (${tq.complexity}): ${tq.query.slice(0, 60)}...`);
      try {
        const result = await arch.run(tq);
        allResults.push(result);
        console.log(
          `  -> OK in ${result.executionTime.toFixed(1)}s (Tools: ${result.toolCalls}, Score: ${result.factScore}/10)`
        );
      } catch (e) {
        console.log(`  -> FAIL: ${e}`);
        allResults.push({
          architecture: arch.name,
          query: tq.query,
          response: String(e),
          executionTime: 0,
          llmCalls: 0,
          toolCalls: 0,
          success: false,
          factScore: 0,
          factsFound: [],
          factsMissed: [],
        });
      }
    }
  }

  printReport(allResults, TEST_QUERIES);
}
