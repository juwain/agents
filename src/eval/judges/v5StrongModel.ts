import { HumanMessage } from "@langchain/core/messages";
import { createEvalLLM } from "../llm.js";
import { trajectoryAsText } from "../agent.js";
import { PROMPT_USEFULNESS, PROMPT_GROUNDEDNESS, PROMPT_EFFICIENCY } from "../prompts.js";
import { FEW_SHOT_USEFULNESS, FEW_SHOT_GROUNDEDNESS, FEW_SHOT_EFFICIENCY } from "../prompts.js";
import { parseJudgeResponse, defaultResult } from "./common.js";
import type { Trajectory, JudgeResult, Rating } from "../types.js";

const strongLLM = createEvalLLM("openai/gpt-4o", 0.1);

const PROMPTS: Record<string, string> = {
  usefulness: PROMPT_USEFULNESS,
  groundedness: PROMPT_GROUNDEDNESS,
  efficiency: PROMPT_EFFICIENCY,
};

const FEW_SHOT: Record<string, string> = {
  usefulness: FEW_SHOT_USEFULNESS + "Now evaluate the following case:\n\n",
  groundedness: FEW_SHOT_GROUNDEDNESS + "Now evaluate the following case:\n\n",
  efficiency: FEW_SHOT_EFFICIENCY + "Now evaluate the following case:\n\n",
};

export async function callJudgeV5(query: string, trajectory: Trajectory): Promise<JudgeResult> {
  const result: JudgeResult = defaultResult();
  const rawResponses: Record<string, string> = {};

  for (const [crit, promptTpl] of Object.entries(PROMPTS)) {
    const prompt = promptTpl
      .replace("{few_shot}", FEW_SHOT[crit] ?? "")
      .replace("{query}", query)
      .replace("{trajectory}", trajectoryAsText(trajectory))
      .replace("{response}", trajectory.final_response);

    const resp = await strongLLM.invoke([new HumanMessage(prompt)]);
    const parsed = parseJudgeResponse(resp.content as string);
    result[crit as keyof Pick<JudgeResult, "usefulness" | "groundedness" | "efficiency">] =
      (parsed?.score as Rating) ?? "so-so";
    rawResponses[crit] = resp.content as string;
  }

  result._raw_responses = rawResponses;
  return result;
}
