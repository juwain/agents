import { FEW_SHOT_USEFULNESS, FEW_SHOT_GROUNDEDNESS, FEW_SHOT_EFFICIENCY } from "../prompts.js";
import { callJudgeV3 } from "./v3PerCriterion.js";
import type { Trajectory, JudgeResult } from "../types.js";

const FEW_SHOT_EXAMPLES: Record<string, string> = {
  usefulness: FEW_SHOT_USEFULNESS + "Now evaluate the following case:\n\n",
  groundedness: FEW_SHOT_GROUNDEDNESS + "Now evaluate the following case:\n\n",
  efficiency: FEW_SHOT_EFFICIENCY + "Now evaluate the following case:\n\n",
};

export async function callJudgeV4(query: string, trajectory: Trajectory): Promise<JudgeResult> {
  return callJudgeV3(query, trajectory, FEW_SHOT_EXAMPLES);
}
