import { MessagesAnnotation } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";
import { llm } from "../llm.js";
import { ALL_TOOLS } from "../tools/index.js";
import { buildSystemPrompt } from "../prompts.js";
import { loadProfile } from "../tools/updateProfile.js";

const llmWithTools = llm.bindTools(ALL_TOOLS, {
  parallel_tool_calls: false,
});

export async function agentNode(
  state: typeof MessagesAnnotation.State
): Promise<Partial<typeof MessagesAnnotation.State>> {
  const profile = loadProfile();
  const systemPrompt = buildSystemPrompt(profile);

  const messages = [
    new SystemMessage(systemPrompt),
    ...state.messages.filter((m) => !(m instanceof SystemMessage)),
  ];

  const response = await llmWithTools.invoke(messages);
  return { messages: [response] };
}
