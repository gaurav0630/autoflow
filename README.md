# AutoFlow 🤖

> AI Agent Orchestration Platform — define a goal in natural language, AutoFlow reasons, plans, and executes it across real systems.

[![Python](https://img.shields.io/badge/Python-3.14+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136+-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-TypeScript-blue)](https://reactjs.org)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange)](https://groq.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-purple)](https://trychroma.com)

---

## 🧠 What is AutoFlow?

Modern businesses rely on dozens of disconnected systems — CRMs, email platforms, databases, APIs. Integrating them requires expensive engineering or brittle rule-based tools.

**AutoFlow solves this.** Users define goals in natural language. AI agents reason through them, use tools, maintain memory, and execute real actions across systems — with RAG-powered document Q&A, conversation history, and full observability.

---

## ✨ Key Features

- 🔄 **ReAct Agent Loop** — LLM reasons, selects tools, observes results, repeats until done
- 🧩 **Tool Registry** — pluggable tools: web search, email, RAG document search
- 🧠 **RAG Memory** — ChromaDB vector store for long-term memory + document Q&A
- 📄 **PDF Upload** — upload any document and ask questions from it in the chat
- 💬 **Conversation Memory** — full chat history sent with every request for context
- 🗂️ **Session History** — past conversations saved locally, grouped by Today / Yesterday / Older
- 🌐 **DAG Orchestration** — multi-step workflows defined as directed acyclic graphs *(coming)*
- ⚡ **Async Task Queue** — Redis + ARQ for non-blocking, scalable workflow execution *(coming)*
- 🛡️ **Guardrails** — validates every LLM output before triggering real-world actions *(coming)*
- 📊 **Full Observability** — every LLM call, tool use, and agent run logged to PostgreSQL *(coming)*

---

## 🏗️ Architecture

```
User Goal (natural language)
        │
        ▼
   Next.js Frontend (Claude-style chat UI)
   ├── Session history (localStorage)
   ├── PDF upload with file preview
   └── Real-time thinking animation
        │
        ▼
   FastAPI Backend (REST API)
        │
        ▼
  AgentRuntime (ReAct Loop)
   ├── Tool Registry (web_search, send_email, rag_search)
   ├── Short-term Memory (conversation history per request)
   └── Long-term Memory (ChromaDB RAG)
        │
        ▼
  Groq LLaMA 3.3 70B (fast inference)
        │
        ▼
  ChromaDB (vector store, persistent on disk)
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Agent Runtime | Python 3.14, Groq LLaMA 3.3 70B, ReAct loop |
| RAG Pipeline | ChromaDB, DuckDuckGo Search, pypdf |
| Backend API | FastAPI, Uvicorn, Pydantic, python-multipart |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Storage | ChromaDB (local), localStorage (sessions) |
| Coming Soon | Redis + ARQ, PostgreSQL, Docker, AWS |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Run locally

```bash
# Clone the repo
git clone https://github.com/gaurav0630/autoflow.git
cd autoflow

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install groq python-dotenv fastapi uvicorn chromadb pypdf ddgs python-multipart

cp .env.example .env   # add your GROQ_API_KEY
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
autoflow/
├── backend/
│   ├── agent/
│   │   ├── __init__.py
│   │   └── runtime.py        # ReAct loop, tool registry, Groq client
│   ├── rag/
│   │   └── ingestor.py       # PDF ingestion, ChromaDB storage + retrieval
│   ├── workflow/             # DAG engine (coming)
│   ├── queue/                # Redis + ARQ workers (coming)
│   ├── guardrails/           # Output validation (coming)
│   ├── db/                   # PostgreSQL models (coming)
│   ├── chroma_db/            # Local vector store (auto-created)
│   ├── .env.example
│   └── main.py               # FastAPI app, /run + /upload endpoints
├── frontend/
│   └── app/
│       └── page.tsx          # Full chat UI with sessions, PDF upload
├── infra/
│   ├── docker-compose.yml
│   └── k8s/
└── README.md
```

---

## 🎯 Demo Use Cases

**1. Company Research**
> "Research Stripe and tell me if they are worth reaching out to"

Agent: searches web → reads real results → reasons → gives recommendation

**2. Document Q&A with RAG**
> Upload your resume or any PDF, then ask: "What skills does this person have?"

Agent: embeds query → retrieves relevant chunks from ChromaDB → answers with context from your document

**3. Multi-turn Conversation**
> "Research Stripe" → "What about their pricing?" → "Would they suit a bootstrapped startup?"

Agent remembers full context across messages within a session

**4. Multi-step DAG Workflow** *(coming)*
> Fetch leads → Research each → Score quality → Draft email if score > 7 → Send

---

## 🗓️ Build Plan

| Week | Focus | Status |
|------|-------|--------|
| 1 | Agent Runtime + Tool Registry + ReAct loop | ✅ Done |
| 2 | RAG + ChromaDB + PDF upload + Conversation memory | ✅ Done |
| 3 | FastAPI backend + Redis async queue | 🔄 FastAPI ✅ · Redis ⏳ |
| 4 | DAG Orchestration + Guardrails + PostgreSQL | ⏳ Upcoming |
| 5 | React Frontend + WebSocket UI + Session history | 🔄 UI ✅ · WebSocket ⏳ |
| 6 | AWS Deploy + Docker + Demo video | ⏳ Upcoming |

---

## 🔌 API Reference

### `POST /run`
Run the agent on a natural language goal.

```json
// Request
{
  "goal": "Research Stripe and tell me if worth reaching out to",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "agent", "content": "Previous response" }
  ]
}

// Response
{
  "result": "Stripe is a payments company valued at $65B..."
}
```

### `POST /upload`
Upload a PDF document for RAG-powered Q&A.

```
Content-Type: multipart/form-data
file: <your PDF>
```

```json
// Response
{
  "message": "Ingested 42 chunks from MyDocument"
}
```

---

## 👤 Author

**Gaurav Verma** — [github.com/gaurav0630](https://github.com/gaurav0630) · [LinkedIn](https://linkedin.com/in/gauravverma1106) · gaurav2001verma11@gmail.com