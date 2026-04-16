import { HumanMessage } from "@langchain/core/messages";
import { evalLLM } from "../llm.js";
import { trajectoryAsText } from "../agent.js";
import { PROMPT_USEFULNESS, PROMPT_GROUNDEDNESS, PROMPT_EFFICIENCY } from "../prompts.js";
import { parseJudgeResponse, defaultResult } from "./common.js";
import type { Trajectory, JudgeResult, Rating } from "../types.js";

const PROMPTS: Record<string, string> = {
  usefulness: PROMPT_USEFULNESS,
  groundedness: PROMPT_GROUNDEDNESS,
  efficiency: PROMPT_EFFICIENCY,
};

export async function callJudgeV3(
  query: string,
  trajectory: Trajectory,
  fewShot: Record<string, string> = {}
): Promise<JudgeResult> {
  const result: JudgeResult = defaultResult();
  const rawResponses: Record<string, string> = {};

  for (const [crit, promptTpl] of Object.entries(PROMPTS)) {
    const prompt = promptTpl
      .replace("{few_shot}", fewShot[crit] ?? "")
      .replace("{query}", query)
      .replace("{trajectory}", trajectoryAsText(trajectory))
      .replace("{response}", trajectory.final_response);

    const resp = await evalLLM.invoke([new HumanMessage(prompt)]);
    const parsed = parseJudgeResponse(resp.content as string);
    result[crit as keyof Pick<JudgeResult, "usefulness" | "groundedness" | "efficiency">] =
      (parsed?.score as Rating) ?? "so-so";
    rawResponses[crit] = resp.content as string;
  }

  result._raw_responses = rawResponses;
  return result;
}
