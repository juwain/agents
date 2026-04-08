import { ChatOpenAI } from "@langchain/openai";
import { MessagesAnnotation } from "@langchain/langgraph";
import { ALL_TOOLS } from "./tools.js";

const model = new ChatOpenAI({
  model: process.env.MODEL ?? "openai/gpt-5-nano",
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  openAIApiKey: process.env.OPENROUTER_API_KEY!,
  temperature: 0.2,
}).bindTools(ALL_TOOLS);

export async function llmNode(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}
