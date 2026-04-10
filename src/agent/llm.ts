import { ChatOpenAI } from "@langchain/openai";

export const llm = new ChatOpenAI({
  model: process.env.MODEL ?? "openai/gpt-5-nano",
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  openAIApiKey: process.env.OPENROUTER_API_KEY!,
  temperature: 0,
});
