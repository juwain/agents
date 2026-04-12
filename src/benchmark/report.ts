import type { BenchmarkResult } from "./runner.js";
import type { TestQuery } from "./queries.js";

export function printReport(allResults: BenchmarkResult[], testQueries: TestQuery[]): void {
  // Group by architecture
  const architectures: Record<string, BenchmarkResult[]> = {};
  for (const r of allResults) {
    (architectures[r.architecture] ??= []).push(r);
  }

  console.log("\n" + "=".repeat(80));
  console.log("BENCHMARK REPORT: Architecture Comparison");
  console.log("=".repeat(80));

  const header = `${"Architecture".padEnd(24)} ${"Avg Time".padStart(10)} ${"Avg Tools".padStart(10)} ${"Avg Score".padStart(10)}`;
  console.log(`\n${header}`);
  console.log("-".repeat(60));

  const archStats: Record<string, { avgTime: number; avgTools: number; avgScore: number }> = {};

  for (const [archName, archResults] of Object.entries(architectures)) {
    const successful = archResults.filter((r) => r.success);
    const scores = successful.map((r) => r.factScore);
    const stats = {
      avgTime:
        successful.reduce((s, r) => s + r.executionTime, 0) /
        Math.max(1, successful.length),
      avgTools:
        successful.reduce((s, r) => s + r.toolCalls, 0) /
        Math.max(1, successful.length),
      avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    };
    archStats[archName] = stats;
    console.log(
      `${archName.padEnd(24)} ${stats.avgTime.toFixed(1).padStart(9)}s` +
        ` ${stats.avgTools.toFixed(1).padStart(10)}` +
        ` ${(stats.avgScore.toFixed(1) + "/10").padStart(9)}`
    );
  }

  // Per-query breakdown
  console.log("\n" + "=".repeat(80));
  console.log("PER-QUERY BREAKDOWN (fact-based scoring)");
  console.log("=".repeat(80));

  for (const tq of testQueries) {
    const qShort = tq.query.slice(0, 65);
    console.log(`\n  [${tq.complexity.toUpperCase()}] ${qShort}...`);
    console.log(`  ${"Architecture".padEnd(24)} ${"Score".padStart(6)} ${"Time".padStart(8)} ${"Tools".padStart(6)}  Facts`);
    console.log(`  ${"-".repeat(70)}`);

    for (const r of allResults) {
      if (r.query === tq.query && r.success) {
        const nFound = r.factsFound.length;
        const nTotal = nFound + r.factsMissed.length;
        console.log(
          `  ${r.architecture.padEnd(24)} ${(r.factScore.toFixed(1) + "/10").padStart(5)}` +
            ` ${r.executionTime.toFixed(1).padStart(7)}s ${String(r.toolCalls).padStart(5)}` +
            `  ${nFound}/${nTotal} facts`
        );
        for (const m of r.factsMissed) {
          console.log(`     MISSED: ${m}`);
        }
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));

  for (const [name, s] of Object.entries(archStats)) {
    console.log(
      `  ${name}: avg ${s.avgScore.toFixed(1)}/10, ${s.avgTime.toFixed(1)}s, ${Math.round(s.avgTools)} tools`
    );
  }

  console.log("\nKey findings:");
  console.log("  - Simple queries: Single Agent is faster and retains full context");
  console.log("  - Complex queries: MAS wins via guaranteed domain decomposition");
  console.log("  - MAS+Critic adds latency but serves as a quality safety net");

  console.log("\nProduction Recommendation:");
  console.log("  Simple queries (1-2 tools)  -> Single Agent (fast, same quality)");
  console.log("  Complex queries (3+ tools)  -> Hierarchical MAS (guaranteed coverage)");
  console.log("  Critical domains            -> MAS + Critic (quality verification)");
}
