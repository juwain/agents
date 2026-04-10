import { MessagesAnnotation } from "@langchain/langgraph";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { llm } from "../llm.js";

// --- PII patterns for log masking ---
const PII_PATTERNS: [RegExp, string][] = [
  [/\b\d{4}\s\d{6}\b/g, "[PASSPORT]"],
  [/\b[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}\b/g, "[EMAIL]"],
  [/\b(?:\d{4}[- ]?){3}\d{4}\b/g, "[CARD]"],
  [/\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g, "[PHONE]"],
];

function maskPii(text: string): string {
  let masked = text;
  for (const [pattern, placeholder] of PII_PATTERNS) {
    masked = masked.replace(pattern, placeholder);
  }
  return masked;
}

async function isOnTopic(userMessage: string): Promise<boolean> {
  const response = await llm.invoke([
    new SystemMessage(
      "You are a relevance classifier for an airline support chatbot. " +
        "Respond with exactly 'yes' or 'no'.\n\n" +
        "Is the following message related to airline support " +
        "(flights, booking, baggage, policies, travel, passenger info)?"
    ),
    new HumanMessage(userMessage),
  ]);
  const answer = (response.content as string).trim().toLowerCase();
  console.log(`[GUARD] is_on_topic → ${answer}`);
  return answer.startsWith("yes");
}

export async function inputGuardNode(
  state: typeof MessagesAnnotation.State
): Promise<Partial<typeof MessagesAnnotation.State>> {
  const messages = state.messages;
  const lastMsg = messages[messages.length - 1];
  const content =
    "content" in lastMsg ? (lastMsg.content as string) : String(lastMsg);

  // PII-safe logging
  console.log(`[LOG] user: ${maskPii(content).slice(0, 120)}`);

  // Relevance filter — only for the first message
  const hasHistory = messages.filter((m) => m instanceof HumanMessage).length > 1;
  if (!hasHistory && !(await isOnTopic(content))) {
    console.log(
      `[GUARD] \uD83D\uDEAB Off-topic request blocked: '${maskPii(content).slice(0, 60)}'`
    );
    return {
      messages: [
        new AIMessage(
          "I'm an airline support assistant. I can only help with " +
            "flight bookings, baggage, policies, and travel-related questions."
        ),
      ],
    };
  }

  return {};
}
