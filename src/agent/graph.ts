import { StateGraph, END, START, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { isAIMessage } from "@langchain/core/messages";
import { llmNode } from "./llmNode.js";
import { ALL_TOOLS } from "./tools.js";

const toolNode = new ToolNode(ALL_TOOLS);

function shouldContinue(state: typeof MessagesAnnotation.State): "tools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1];
  if (isAIMessage(lastMessage) && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return END;
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("llm", llmNode)
  .addNode("tools", toolNode)
  .addEdge(START, "llm")
  .addConditionalEdges("llm", shouldContinue, ["tools", END])
  .addEdge("tools", "llm");

export const app = workflow.compile();
