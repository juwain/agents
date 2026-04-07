from langchain_core.messages import HumanMessage, SystemMessage

from agent.graph import app
from agent.prompts import SYSTEM_PROMPT


def main():
    print("Airline Agent (type 'quit' to exit)")
    print("-" * 40)

    messages: list = [SystemMessage(content=SYSTEM_PROMPT)]

    while True:
        user_input = input("\nYou: ").strip()
        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit"):
            print("Goodbye!")
            break

        messages.append(HumanMessage(content=user_input))
        result = app.invoke({"messages": messages})
        messages = result["messages"]

        ai_response = messages[-1].content
        print(f"\nAgent: {ai_response}")


if __name__ == "__main__":
    main()
