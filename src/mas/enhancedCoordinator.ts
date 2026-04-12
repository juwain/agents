import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { CoordinatorAgent } from "./coordinator.js";
import { CriticAgent } from "./criticAgent.js";
import { SpecializedAgent } from "./specialistAgent.js";
import type { AgentResult, CriticFeedback } from "../agent/schemas.js";

export class EnhancedCoordinator extends CoordinatorAgent {
  private critic: CriticAgent;
  private maxRevisions: number;

  constructor(
    specialistAgents: Record<string, SpecializedAgent>,
    maxRevisions = 1
  ) {
    super(specialistAgents);
    this.critic = new CriticAgent();
    this.maxRevisions = maxRevisions;
  }

  async processQueryWithQC(
    userQuery: string
  ): Promise<{ answer: string; results: AgentResult[]; feedback: CriticFeedback }> {
    console.log(`\n${"=".repeat(60)}`);
    console.log("ENHANCED COORDINATOR (with Critic)");
    console.log("=".repeat(60));

    console.log("\n[Step 1] Planning...");
    const plan = await this.createPlan(userQuery);
    console.log(`  Tasks: ${plan.subtasks.length}`);

    console.log("\n[Step 2] Delegating...");
    const results = await this.executePlan(plan);

    console.log("\n[Step 3] Synthesizing...");
    let answer = await this.synthesize(userQuery, results);

    console.log("\n[Step 4] Critic review...");
    let feedback = await this.critic.review(userQuery, answer, results);
    console.log(`  Score: ${feedback.score}/10 | Approved: ${feedback.approved}`);
    if (feedback.issues.length > 0) {
      console.log(`  Issues: ${feedback.issues}`);
    }

    if (!feedback.approved && this.maxRevisions > 0) {
      console.log("\n[Step 5] Revising based on critic feedback...");

      const resultsText = results
        .map((r) => `[${r.agent_name}]: ${r.result.slice(0, 2000)}`)
        .join("\n");

      const revisionPrompt =
        `Improve the answer based on the critic's feedback.\n` +
        `Issues: ${feedback.issues}\n` +
        `Suggestions: ${feedback.suggestions}\n\n` +
        `Original answer:\n${answer}\n\n` +
        `Specialist data (use ONLY this data, do NOT invent facts):\n${resultsText}`;

      const revised = await this.synthesisLlm.invoke([
        new SystemMessage(
          "You are the coordinator. Improve the answer based on critic feedback. " +
            "Use ONLY the specialist data provided. Do NOT invent or assume any facts."
        ),
        new HumanMessage(revisionPrompt),
      ]);
      answer = revised.content as string;

      feedback = await this.critic.review(userQuery, answer, results);
      console.log(`  Revised score: ${feedback.score}/10 | Approved: ${feedback.approved}`);
    }

    console.log(`\n${"=".repeat(60)}`);
    console.log("FINAL ANSWER (with QC):");
    console.log("=".repeat(60));
    console.log(answer);

    return { answer, results, feedback };
  }
}
