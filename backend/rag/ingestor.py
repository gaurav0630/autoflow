import chromadb
from pypdf import PdfReader

# ChromaDB stored locally in a folder
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="documents")

def ingest_pdf(file_path: str, doc_name: str) -> int:
    """Read a PDF, split into chunks, store in ChromaDB. Returns chunk count."""
    reader = PdfReader(file_path)
    chunks = []

    for page_num, page in enumerate(reader.pages):
        text = page.extract_text()
        if not text:
            continue
        # Split each page into ~500 char chunks with overlap
        words = text.split()
        chunk_size = 100  # words per chunk
        for i in range(0, len(words), chunk_size - 10):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append({
                    "text": chunk,
                    "page": page_num + 1,
                    "doc": doc_name
                })

    if not chunks:
        return 0

    # Store in ChromaDB
    collection.add(
        documents=[c["text"] for c in chunks],
        metadatas=[{"page": c["page"], "doc": c["doc"]} for c in chunks],
        ids=[f"{doc_name}_chunk_{i}" for i in range(len(chunks))]
    )

    print(f"✅ Ingested {len(chunks)} chunks from '{doc_name}'")
    return len(chunks)

def query_documents(question: str, n_results: int = 3) -> str:
    """Find most relevant chunks for a question."""
    results = collection.query(
        query_texts=[question],
        n_results=n_results
    )
    if not results["documents"][0]:
        return "No relevant documents found."

    output = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        output.append(f"[{meta['doc']} p.{meta['page']}]: {doc}")

    return "\n\n".join(output)

if __name__ == "__main__":
    # Quick test
    result = query_documents("test query")
    print(result)