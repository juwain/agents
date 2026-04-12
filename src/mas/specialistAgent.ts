import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { StructuredToolInterface } from "@langchain/core/tools";
import { llm } from "../agent/llm.js";
import type { AgentResult } from "../agent/schemas.js";

export class SpecializedAgent {
  name: string;
  tools: StructuredToolInterface[];
  graph: ReturnType<typeof createReactAgent>;

  constructor(
    name: string,
    tools: StructuredToolInterface[],
    systemPrompt: string
  ) {
    this.name = name;
    this.tools = tools;
    this.graph = createReactAgent({
      llm,
      tools,
      prompt: systemPrompt,
    });
  }

  async process(taskDescription: string): Promise<AgentResult> {
    try {
      const result = await this.graph.invoke({
        messages: [new HumanMessage(taskDescription)],
      });

      const toolsUsed: string[] = [];
      for (const msg of result.messages) {
        if (
          "tool_calls" in msg &&
          (msg as AIMessage).tool_calls &&
          (msg as AIMessage).tool_calls!.length > 0
        ) {
          toolsUsed.push(
            ...(msg as AIMessage).tool_calls!.map((tc) => tc.name)
          );
        }
      }

      const finalContent =
        result.messages[result.messages.length - 1].content;

      return {
        agent_name: this.name,
        status: "success",
        result: typeof finalContent === "string" ? finalContent : JSON.stringify(finalContent),
        tools_used: toolsUsed,
      };
    } catch (e) {
      return {
        agent_name: this.name,
        status: "error",
        result: `Error: ${e}`,
        tools_used: [],
      };
    }
  }
}
