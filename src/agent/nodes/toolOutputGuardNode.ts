import { MessagesAnnotation } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";

const INJECTION_PATTERNS =
  /\[SYSTEM[:\s]|ignore\s+|disregard\s+|new\s+instructions?|override\s+|you\s+are\s+now\s+|forget\s+|act\s+as\s+if/i;

export async function toolOutputGuardNode(
  state: typeof MessagesAnnotation.State
): Promise<Partial<typeof MessagesAnnotation.State>> {
  const lastMsg = state.messages[state.messages.length - 1];

  if (!(lastMsg instanceof ToolMessage)) return {};
  if (lastMsg.name !== "search_flights") return {};

  let flights: Array<Record<string, unknown>>;
  try {
    flights = JSON.parse(lastMsg.content as string);
  } catch {
    return {};
  }
  if (!Array.isArray(flights)) return {};

  const cleanFlights: Array<Record<string, unknown>> = [];
  for (const flight of flights) {
    const fareRules = (flight.fare_rules as string) ?? "";
    if (INJECTION_PATTERNS.test(fareRules)) {
      console.log(
        `[GUARD] \u26A0\uFE0F  Flight ${flight.flight_id} dropped: injection detected`
      );
      console.log(`         Snippet: '${fareRules.slice(0, 80)}...'`);
    } else {
      cleanFlights.push(flight);
    }
  }

  if (cleanFlights.length === flights.length) return {};

  const cleanedMsg = new ToolMessage({
    content: JSON.stringify(cleanFlights),
    tool_call_id: lastMsg.tool_call_id,
    name: lastMsg.name,
    id: lastMsg.id,
  });
  return { messages: [cleanedMsg] };
}
