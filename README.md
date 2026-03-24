# AutoFlow 🤖

> AI Agent Orchestration Platform — define a goal in natural language, AutoFlow reasons, plans, and executes it across real systems.

[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-TypeScript-blue)](https://reactjs.org)
[![Redis](https://img.shields.io/badge/Redis-Queue-red)](https://redis.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)](https://postgresql.org)

---

## 🧠 What is AutoFlow?

Modern businesses rely on dozens of disconnected systems — CRMs, email platforms, databases, APIs. Integrating them requires expensive engineering or brittle rule-based tools.

**AutoFlow solves this.** Users define goals in natural language. AI agents reason through them, use tools, maintain memory, and execute real actions across systems — with async task handling, reliability guardrails, and full observability.

---

## ✨ Key Features

- 🔄 **ReAct Agent Loop** — LLM reasons, selects tools, observes results, repeats until done
- 🧩 **Tool Registry** — pluggable tools: web search, email, database queries, HTTP requests
- 🧠 **RAG Memory** — ChromaDB vector store for long-term memory + document Q&A
- ⚡ **Async Task Queue** — Redis + ARQ for non-blocking, scalable workflow execution
- 🌐 **DAG Orchestration** — multi-step workflows defined as directed acyclic graphs
- 🛡️ **Guardrails** — validates every LLM output before triggering real-world actions
- 📊 **Full Observability** — every LLM call, tool use, and agent run logged to PostgreSQL
- 💬 **React Chat UI** — real-time WebSocket interface to run and monitor agents

---

## 🏗️ Architecture
```
User Goal (natural language)
        │
        ▼
   FastAPI Backend
        │
        ▼
  AgentRuntime (ReAct Loop)
   ├── Tool Registry (web_search, send_email, query_db)
   ├── Short-term Memory (conversation context)
   └── Long-term Memory (ChromaDB RAG)
        │
        ▼
  WorkflowEngine (DAG)
   └── Redis + ARQ Task Queue (async workers)
        │
        ▼
  PostgreSQL (audit logs, run history)
        │
        ▼
  React Frontend (WebSocket real-time updates)
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Agent Runtime | Python, OpenAI GPT-4, ReAct loop |
| RAG Pipeline | ChromaDB, OpenAI Embeddings |
| Async Queue | Redis, ARQ |
| Backend API | FastAPI, Python 3.11+, Pydantic |
| Database | PostgreSQL |
| Frontend | React, TypeScript, Redux, Tailwind CSS |
| Cloud | AWS EC2, S3, RDS, Docker |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Docker Desktop
- Node.js 18+
- OpenAI API key

### Run locally
```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/autoflow.git
cd autoflow

# Start Redis + PostgreSQL
docker-compose up -d

# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your OpenAI key
python main.py

# Frontend
cd frontend
npm install && npm run dev
```

---

## 📁 Project Structure
```
autoflow/
├── backend/
│   ├── agent/        # AgentRuntime, ReAct loop, tool registry
│   ├── rag/          # ChromaDB, embeddings, document ingestion
│   ├── workflow/     # DAG engine, WorkflowEngine
│   ├── queue/        # Redis + ARQ workers
│   ├── guardrails/   # Output validation, safety checks
│   ├── api/          # FastAPI routes, WebSocket handler
│   ├── db/           # PostgreSQL models, migrations
│   └── main.py
├── frontend/
│   └── src/
│       ├── components/   # Chat, WorkflowBuilder, AgentStatus
│       ├── store/        # Redux slices
│       └── hooks/        # WebSocket hook, API hooks
├── infra/
│   ├── docker-compose.yml
│   └── k8s/
└── README.md
```

---

## 🎯 Demo Use Cases

**1. Company Research + Outreach Email**
> "Research Acme Corp and write a personalised cold outreach email"
Agent: searches web → reads results → composes email → guardrails check → sends

**2. Document Q&A with RAG**
> Upload a PDF, ask "What are the API rate limits?"
Agent: embeds query → retrieves relevant chunks → answers with context

**3. Multi-step DAG Workflow**
> Fetch leads → Research each → Score quality → Draft email if score > 7 → Send

---

## 🗓️ Build Plan

| Week | Focus | Status |
|------|-------|--------|
| 1 | Agent Runtime + Tool Registry + ReAct loop | 🔄 In Progress |
| 2 | RAG + ChromaDB long-term memory | ⏳ Upcoming |
| 3 | FastAPI backend + Redis async queue | ⏳ Upcoming |
| 4 | DAG Orchestration + Guardrails + PostgreSQL | ⏳ Upcoming |
| 5 | React Frontend + WebSocket UI | ⏳ Upcoming |
| 6 | AWS Deploy + Docker + Demo video | ⏳ Upcoming |

---

## 👤 Author

**Gaurav Verma** — [github.com/gaurav0630](https://github.com/gaurav0630) · [LinkedIn](https://linkedin.com/in/gauravverma1106) · gauravverma.jhns@gmail.com