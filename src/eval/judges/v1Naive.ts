import { HumanMessage } from "@langchain/core/messages";
import { evalLLM } from "../llm.js";
import { trajectoryAsText } from "../agent.js";
import { JUDGE_V1_PROMPT } from "../prompts.js";
import { parseJudgeResponse, defaultResult } from "./common.js";
import type { Trajectory, JudgeResult, Rating } from "../types.js";
import { CRITERIA } from "../types.js";

export async function callJudgeV1(query: string, trajectory: Trajectory): Promise<JudgeResult> {
  const prompt = JUDGE_V1_PROMPT
    .replace("{query}", query)
    .replace("{trajectory}", trajectoryAsText(trajectory))
    .replace("{response}", trajectory.final_response);

  const resp = await evalLLM.invoke([new HumanMessage(prompt)]);
  const parsed = parseJudgeResponse(resp.content as string, CRITERIA);
  const result = parsed
    ? {
        usefulness: parsed.usefulness as Rating,
        groundedness: parsed.groundedness as Rating,
        efficiency: parsed.efficiency as Rating,
      }
    : defaultResult();
  result._raw_response = resp.content as string;
  return result as JudgeResult;
}
