import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { createEvalLLM } from "./llm.js";
import { IRON_USER_PROMPT_V2 } from "./prompts.js";
import type { EvalTask } from "./types.js";

const ironUserLLM = createEvalLLM(undefined, 0.3);

export async function ironUserReply(
  task: EvalTask,
  conversation: BaseMessage[]
): Promise<string> {
  const system = IRON_USER_PROMPT_V2
    .replace("{scenario}", task.scenario ?? "")
    .replace("{user_context}", task.user_context ?? "");

  const messages: BaseMessage[] = [
    new SystemMessage(system),
    ...conversation,
  ];

  const resp = await ironUserLLM.invoke(messages);
  return resp.content as string;
}

const END_PHRASES = [
  "thank you", "thanks", "great", "all done", "done",
  "ok, never mind", "never mind", "no need", "all set",
];

export function isConversationDone(reply: string): boolean {
  const lower = reply.toLowerCase();
  return END_PHRASES.some((phrase) => lower.includes(phrase));
}
