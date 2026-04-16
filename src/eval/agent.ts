import { StateGraph, MessagesAnnotation, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, SystemMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";
import { evalLLM } from "./llm.js";
import { EVAL_TOOLS } from "./tools.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { snapshotDB } from "./db.js";
import type { Trajectory, Step } from "./types.js";

function buildEvalAgent() {
  const toolNode = new ToolNode(EVAL_TOOLS);
  const llmWithTools = evalLLM.bindTools(EVAL_TOOLS);

  function callModel(state: typeof MessagesAnnotation.State) {
    const response = llmWithTools.invoke(state.messages);
    return response.then((r) => ({ messages: [r] }));
  }

  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const last = state.messages[state.messages.length - 1];
    if (last instanceof AIMessage && last.tool_calls?.length) {
      return "tools";
    }
    return END;
  }

  const builder = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, ["tools", END])
    .addEdge("tools", "agent");

  return builder.compile();
}

const agentGraph = buildEvalAgent();

export async function runAgent(
  query: string,
  taskId: string,
  messages?: BaseMessage[]
): Promise<{ trajectory: Trajectory; messages: BaseMessage[] }> {
  const dbBefore = snapshotDB();
  const trajectory: Trajectory = {
    task_id: taskId,
    query,
    steps: [],
    final_response: "",
    db_before: dbBefore,
    db_after: null,
  };

  const inputMessages = messages ?? [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(query),
  ];

  const result = await agentGraph.invoke({ messages: inputMessages });
  const allMessages = result.messages as BaseMessage[];

  for (const msg of allMessages) {
    if (msg instanceof AIMessage) {
      if (msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          trajectory.steps.push({
            type: "action",
            content: { tool: tc.name, args: tc.args },
          });
        }
      } else if (msg.content) {
        trajectory.steps.push({ type: "response", content: msg.content });
        trajectory.final_response = msg.content as string;
      }
    } else if (msg instanceof ToolMessage) {
      trajectory.steps.push({
        type: "observation",
        content: (msg.content as string).slice(0, 500),
      });
    }
  }

  trajectory.db_after = snapshotDB();
  return { trajectory, messages: allMessages };
}

export function trajectoryAsText(t: Trajectory): string {
  return t.steps
    .map((s) => {
      const txt = typeof s.content === "string"
        ? s.content
        : JSON.stringify(s.content);
      return `[${s.type}] ${txt.slice(0, 500)}`;
    })
    .join("\n");
}
