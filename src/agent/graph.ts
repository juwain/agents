import { StateGraph, END, START, MessagesAnnotation, MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { isAIMessage } from "@langchain/core/messages";
import { agentNode } from "./nodes/agentNode.js";
import { inputGuardNode } from "./nodes/inputGuardNode.js";
import { toolOutputGuardNode } from "./nodes/toolOutputGuardNode.js";
import { ALL_TOOLS } from "./tools/index.js";

const toolNode = new ToolNode(ALL_TOOLS);

function routeAfterInputGuard(
  state: typeof MessagesAnnotation.State
): "agent" | typeof END {
  const lastMsg = state.messages[state.messages.length - 1];
  if (isAIMessage(lastMsg)) return END; // blocked by guard
  return "agent";
}

function routeAfterAgent(
  state: typeof MessagesAnnotation.State
): "tools" | typeof END {
  const lastMsg = state.messages[state.messages.length - 1];
  if (isAIMessage(lastMsg) && lastMsg.tool_calls?.length) return "tools";
  return END;
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("input_guard", inputGuardNode)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addNode("tool_output_guard", toolOutputGuardNode)
  .addEdge(START, "input_guard")
  .addConditionalEdges("input_guard", routeAfterInputGuard, ["agent", END])
  .addConditionalEdges("agent", routeAfterAgent, ["tools", END])
  .addEdge("tools", "tool_output_guard")
  .addEdge("tool_output_guard", "agent");

export const app = workflow.compile({
  checkpointer: new MemorySaver(),
});
