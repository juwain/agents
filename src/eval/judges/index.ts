import { callJudgeV1 } from "./v1Naive.js";
import { callJudgeV2 } from "./v2Rubric.js";
import { callJudgeV3 } from "./v3PerCriterion.js";
import { callJudgeV4 } from "./v4FewShot.js";
import { callJudgeV5 } from "./v5StrongModel.js";
import type { JudgeVersion } from "../types.js";

export const ALL_JUDGES: JudgeVersion[] = [
  { name: "LLM Judge v1 (naive)", version: 1, call: callJudgeV1 },
  { name: "LLM Judge v2 (rubric)", version: 2, call: callJudgeV2 },
  { name: "LLM Judge v3 (per-criterion + CoT)", version: 3, call: (q, t) => callJudgeV3(q, t) },
  { name: "LLM Judge v4 (+ few-shot)", version: 4, call: callJudgeV4 },
  { name: "LLM Judge v5 (gpt-4o)", version: 5, call: callJudgeV5 },
];

export function getJudge(version: number): JudgeVersion | undefined {
  return ALL_JUDGES.find((j) => j.version === version);
}
