import { ChatOpenAI } from "@langchain/openai";

export function createEvalLLM(modelOverride?: string, temperature = 0): ChatOpenAI {
  return new ChatOpenAI({
    model: modelOverride ?? process.env.MODEL ?? "openai/gpt-5-nano",
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    openAIApiKey: process.env.OPENROUTER_API_KEY!,
    temperature,
  });
}

export const evalLLM = createEvalLLM();
