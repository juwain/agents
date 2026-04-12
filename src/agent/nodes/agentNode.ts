import { MessagesAnnotation } from "@langchain/langgraph";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
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

  // Thought extraction: if LLM calls a tool without reasoning text,
  // make an extra call to extract the thought behind the action.
  const hasTextContent =
    typeof response.content === "string"
      ? response.content.trim().length > 0
      : Array.isArray(response.content) && response.content.length > 0;
  if (response.tool_calls && response.tool_calls.length > 0 && !hasTextContent) {
    const toolInfo = response.tool_calls.map((tc) => tc.name).join(", ");
    const thought = await llm.invoke([
      ...messages,
      new HumanMessage({
        content:
          `You chose to call: ${toolInfo}. ` +
          "In 1 sentence, explain why this is the right next step. " +
          "Reply with ONLY your reasoning, no tool calls.",
      }),
    ]);
    response.content = thought.content;
  }

  return { messages: [response] };
}
