import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { llm } from "../agent/llm.js";
import { CriticFeedbackSchema } from "../agent/schemas.js";
import type { AgentResult, CriticFeedback } from "../agent/schemas.js";
import { CRITIC_EVAL_PROMPT } from "./prompts.js";

const criticLlm = llm.withStructuredOutput(CriticFeedbackSchema);

export class CriticAgent {
  async review(
    userQuery: string,
    proposedAnswer: string,
    agentResults?: AgentResult[]
  ): Promise<CriticFeedback> {
    let context = "";
    if (agentResults && agentResults.length > 0) {
      context =
        "\n\nData from specialists:\n" +
        agentResults
          .map((r) => `[${r.agent_name}]: ${r.result.slice(0, 2000)}`)
          .join("\n");
    }

    const raw = await criticLlm.invoke([
      new SystemMessage(CRITIC_EVAL_PROMPT),
      new HumanMessage(
        `Customer request: ${userQuery}\n\nProposed answer:\n${proposedAnswer}${context}`
      ),
    ]);

    return {
      ...raw,
      issues: raw.issues ?? [],
      suggestions: raw.suggestions ?? [],
    };
  }
}
