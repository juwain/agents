import "dotenv/config";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { app } from "./agent/graph.js";
import { SYSTEM_PROMPT } from "./agent/prompts.js";
import { createInterface } from "readline/promises";

async function main() {
  console.log("Airline Agent (type 'quit' to exit)");
  console.log("-".repeat(40));

  let messages: (SystemMessage | HumanMessage)[] = [new SystemMessage(SYSTEM_PROMPT)];

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  while (true) {
    const userInput = (await rl.question("\nYou: ")).trim();
    if (!userInput) continue;
    if (userInput.toLowerCase() === "quit" || userInput.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    messages.push(new HumanMessage(userInput));
    const result = await app.invoke({ messages });
    messages = result.messages as (SystemMessage | HumanMessage)[];

    const aiResponse = messages[messages.length - 1].content as string;
    console.log(`\nAgent: ${aiResponse}`);
  }
}

main().catch(console.error);
