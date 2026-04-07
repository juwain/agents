import os

from pydantic import SecretStr
from langchain_openai import ChatOpenAI

from agent.state import AgentState
from agent.tools import ALL_TOOLS

llm = ChatOpenAI(
    model=os.environ.get("MODEL", "openai/gpt-5-nano"),
    base_url="https://openrouter.ai/api/v1",
    api_key=SecretStr(os.environ["OPENROUTER_API_KEY"]),
    temperature=0.2,
).bind_tools(ALL_TOOLS)


def llm_node(state: AgentState) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}
