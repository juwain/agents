from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition

from agent.state import AgentState
from agent.llm_node import llm_node
from agent.tools import ALL_TOOLS

tools_node = ToolNode(ALL_TOOLS)

graph = StateGraph(AgentState)
graph.add_node("llm", llm_node)
graph.add_node("tools", tools_node)

graph.set_entry_point("llm")

graph.add_conditional_edges("llm", tools_condition, {"tools": "tools", END: END})
graph.add_edge("tools", "llm")

app = graph.compile()
