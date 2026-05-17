from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from agent.runtime import run_agent
import shutil, os

app = FastAPI(title="AutoFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str        # "user" or "agent"
    content: str

class RunRequest(BaseModel):
    goal: str
    history: Optional[List[ChatMessage]] = []

class RunResponse(BaseModel):
    result: str

@app.get("/")
def health():
    return {"status": "AutoFlow is running"}

@app.post("/run", response_model=RunResponse)
def run(request: RunRequest):
    result = run_agent(request.goal, history=request.history)
    return RunResponse(result=result)

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    from rag.ingestor import ingest_pdf
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    doc_name = os.path.splitext(file.filename)[0]
    chunk_count = ingest_pdf(temp_path, doc_name)
    os.remove(temp_path)
    return {"message": f"Ingested {chunk_count} chunks from {file.filename}"}