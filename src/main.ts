import "dotenv/config";
import { randomUUID } from "crypto";
import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { app } from "./agent/graph.js";
import { createInterface } from "readline/promises";

async function main() {
  const threadId = randomUUID();
  const config = { configurable: { thread_id: threadId } };

  console.log("Airline Agent (type 'quit' to exit)");
  console.log(`Thread: ${threadId}`);
  console.log("-".repeat(40));

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  while (true) {
    const userInput = (await rl.question("\nYou: ")).trim();
    if (!userInput) continue;
    if (userInput.toLowerCase() === "quit" || userInput.toLowerCase() === "exit") {
      console.log("Goodbye!");
      rl.close();
      break;
    }

    await app.invoke({ messages: [new HumanMessage(userInput)] }, config);

    // Check for interrupt (human-in-the-loop booking approval)
    const snapshot = await app.getState(config);

    if (snapshot.next && snapshot.next.length > 0) {
      const interruptValue = snapshot.tasks[0]?.interrupts?.[0]?.value as
        | Record<string, unknown>
        | undefined;

      if (interruptValue) {
        console.log("\n--- Booking requires approval ---");
        for (const [k, v] of Object.entries(interruptValue)) {
          if (k === "flight_details") {
            const fd = v as Record<string, unknown>;
            console.log(
              `  flight: ${fd.origin} → ${fd.destination}, ${fd.date}, ${fd.fare_class}, $${fd.price}`
            );
          } else {
            console.log(`  ${k}: ${v}`);
          }
        }

        const answer = (
          await rl.question("\nApprove booking? (yes/no): ")
        ).trim().toLowerCase();

        const decision = answer === "yes" || answer === "y" ? "approved" : "rejected";
        console.log(`[Operator] ${decision}`);

        const result = await app.invoke(new Command({ resume: decision }), config);
        const msgs = result.messages as Array<{ content: string }>;
        console.log(`\nAgent: ${msgs[msgs.length - 1].content}`);
        continue;
      }
    }

    // Normal response
    const state = await app.getState(config);
    const messages = state.values.messages as Array<{ content: string }>;
    console.log(`\nAgent: ${messages[messages.length - 1].content}`);
  }
}

main().catch(console.error);
