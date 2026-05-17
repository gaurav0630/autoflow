import os
from groq import Groq
from dotenv import load_dotenv
from rag.ingestor import query_documents

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
print("Client Key", client)

def web_search(query: str) -> str:
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
        if not results:
            return "No results found."
        return "\n".join(
            f"- {r['title']}: {r['body']}" for r in results
        )
    except Exception as e:
        return f"Search failed: {e}"

def send_email(to: str, subject: str, body: str) -> str:
    print(f"\n📧 EMAIL → {to}\nSubject: {subject}\n{body}")
    return f"Email sent to {to}"

def rag_search(question: str) -> str:
    """Search uploaded documents for relevant information."""
    return query_documents(question)

TOOLS = {
    "web_search": web_search,
    "send_email": send_email,
    "rag_search": rag_search,
}

TOOL_DESCRIPTIONS = """
Available tools:
- web_search(query) → searches the web, returns a summary
- send_email(to, subject, body) → sends an email
- rag_search(question) → searches uploaded documents/PDFs for relevant information
"""

SYSTEM_PROMPT = f"""You are AutoFlow, an AI agent that completes goals step by step.

{TOOL_DESCRIPTIONS}

Use EXACTLY this format for every step:

Thought: <your reasoning about what to do next>
Action: <tool_name>
Input: <input to the tool, as plain text>

When you have enough information to answer, use:

Thought: I now have everything I need.
Final Answer: <your final response to the user>

Rules:
- Never skip the Thought step
- Only use tools from the list above
- Always end with Final Answer
"""

def run_agent(goal: str, max_steps: int = 10, history=None) -> str:
    print(f"\n🎯 Goal: {goal}\n{'─'*50}")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject conversation history so agent has context
    if history:
        for msg in history[:-1]:  # exclude last message (that's current goal)
            role = "user" if msg.role == "user" else "assistant"
            # Skip internal agent reasoning — just keep clean user/agent exchanges
            content = msg.content
            if len(content) > 500:
                content = content[:500] + "..."  # trim long messages to save tokens
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": goal})

    for step in range(1, max_steps + 1):
        print(f"\n[Step {step}]")

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0,
            max_tokens=1024,
            stop=["Observation:"],
        )

        text = response.choices[0].message.content.strip()
        print(text)
        messages.append({"role": "assistant", "content": text})

        if "Final Answer:" in text:
            answer = text.split("Final Answer:")[-1].split("\n")[0].strip()
            print(f"\n✅ Done!\n{'─'*50}\n{answer}")
            return answer

        if "Action:" in text and "Input:" in text:
            try:
                action = text.split("Action:")[1].split("\n")[0].strip()
                input_ = text.split("Input:")[1].split("\n")[0].strip()

                tool_fn = TOOLS.get(action)
                if tool_fn:
                    if action == "send_email":
                        print(f"\n📧 DRAFT EMAIL:\n{input_}")
                        # parts = dict(p.split("=", 1) for p in input_.split(",") if "=" in p)
                        observation = tool_fn(
                            to=parts.get("to", "").strip(),
                            subject=parts.get("subject", "").strip(),
                            body=parts.get("body", "").strip(),
                        )
                    else:
                        observation = tool_fn(input_)
                else:
                    observation = f"Tool '{action}' not found. Available: {list(TOOLS.keys())}"

                print(f"\n🔍 Observation: {observation}")
                messages.append({"role": "user", "content": f"Observation: {observation}"})

            except Exception as e:
                messages.append({"role": "user", "content": f"Observation: Error — {e}"})
        else:
            messages.append({
                "role": "user",
                "content": "Please continue. Use Thought/Action/Input format, or write Final Answer if done."
            })

    return "Agent reached max steps without completing the goal."

if __name__ == "__main__":
    result = run_agent("Research Acme Corp and tell me if they're worth reaching out to.")
    print(f"\nFinal result:\n{result}")
