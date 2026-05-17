'use client';

import { useState, useRef, useEffect } from 'react';
import { Github, Send, Paperclip, X, Plus, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  attachedFile?: string;
}

interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const EXAMPLE_PROMPTS = [
  { icon: '📊', text: 'Analyze my recent sales data and identify trends' },
  { icon: '📣', text: 'Create a marketing strategy for Q2 2026' },
  { icon: '🔍', text: 'Generate a customer insight report' },
];

// Persist sessions to localStorage
const saveSessions = (sessions: Session[]) => {
  localStorage.setItem('autoflow_sessions', JSON.stringify(sessions));
};

const loadSessions = (): Session[] => {
  try {
    const raw = localStorage.getItem('autoflow_sessions');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((s: Session) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      messages: s.messages.map((m: Message) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch {
    return [];
  }
};

export default function AutoFlow() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const updateSession = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === sessionId ? { ...s, messages: newMessages } : s
      );
      saveSessions(updated);
      return updated;
    });
  };

  const createNewSession = (firstMessage?: string): string => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: firstMessage
        ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '')
        : 'New Session',
      messages: [],
      createdAt: new Date(),
    };
    setSessions(prev => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId(newSession.id);
    return newSession.id;
  };

  const deleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveSessions(updated);
      return updated;
    });
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://localhost:8000/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.message;
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !pendingFile) return;
    if (isLoading) return;

    const goal = inputValue.trim() || `Summarize the uploaded document: ${pendingFile?.name}`;
    const attachedFileName = pendingFile?.name;

    // Create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = createNewSession(goal);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim() || `📄 Uploaded: ${pendingFile?.name}`,
      timestamp: new Date(),
      attachedFile: attachedFileName,
    };

    // Get current messages for this session
    const currentMessages = sessions.find(s => s.id === sessionId)?.messages ?? [];
    const messagesWithUser = [...currentMessages, userMessage];
    updateSession(sessionId, messagesWithUser);

    setInputValue('');
    setIsLoading(true);

    let uploadMessage = '';

    try {
      if (pendingFile) {
        setIsUploading(true);
        uploadMessage = await uploadFile(pendingFile);
        setUploadedDocs(prev => [...prev, pendingFile.name]);
        setPendingFile(null);
        setIsUploading(false);
      }

      const response = await fetch('http://localhost:8000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          history: messagesWithUser.map(m => ({
            role: m.type,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: (uploadMessage ? `📄 ${uploadMessage}\n\n` : '') + (data.result || 'I encountered an issue.'),
        timestamp: new Date(),
      };

      // Update session title from first user message
      const finalMessages = [...messagesWithUser, agentMessage];
      setSessions(prev => {
        const updated = prev.map(s =>
          s.id === sessionId
            ? {
                ...s,
                messages: finalMessages,
                title: s.title === 'New Session'
                  ? goal.slice(0, 40) + (goal.length > 40 ? '...' : '')
                  : s.title,
              }
            : s
        );
        saveSessions(updated);
        return updated;
      });

    } catch {
      setIsUploading(false);
      setPendingFile(null);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        content: 'Error: Could not reach the agent. Make sure the backend is running at http://localhost:8000',
        timestamp: new Date(),
      };
      updateSession(sessionId, [...messagesWithUser, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (inputValue.trim().length > 0 || pendingFile !== null) && !isLoading;

  // Group sessions by date
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped = {
    Today: sessions.filter(s => new Date(s.createdAt).toDateString() === today.toDateString()),
    Yesterday: sessions.filter(s => new Date(s.createdAt).toDateString() === yesterday.toDateString()),
    Older: sessions.filter(s => {
      const d = new Date(s.createdAt);
      return d.toDateString() !== today.toDateString() && d.toDateString() !== yesterday.toDateString();
    }),
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#212121', color: '#ececec', fontFamily: "'Söhne', 'ui-sans-serif', system-ui, sans-serif" }}>

      {/* Sidebar */}
      <div style={{ width: 260, background: '#171717', display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2a2a', flexShrink: 0 }}>

        {/* Logo + New */}
        <div style={{ padding: '16px 12px', borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>AutoFlow</span>
          </div>
          <button
            onClick={() => { setActiveSessionId(null); setInputValue(''); setPendingFile(null); }}
            style={{ width: '100%', padding: '8px 12px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 8, color: '#ececec', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#333')}
            onMouseLeave={e => (e.currentTarget.style.background = '#2a2a2a')}
          >
            <Plus size={14} /> New Chat
          </button>
        </div>

        {/* Session History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {sessions.length === 0 && (
            <p style={{ fontSize: 12, color: '#555', textAlign: 'center', marginTop: 24 }}>No conversations yet</p>
          )}

          {Object.entries(grouped).map(([group, groupSessions]) =>
            groupSessions.length === 0 ? null : (
              <div key={group} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '4px 8px', marginBottom: 4 }}>{group}</p>
                {groupSessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: activeSessionId === session.id ? '#2a2a2a' : 'transparent',
                      marginBottom: 2, transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => { if (activeSessionId !== session.id) e.currentTarget.style.background = '#222'; }}
                    onMouseLeave={e => { if (activeSessionId !== session.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ flex: 1, fontSize: 13, color: activeSessionId === session.id ? '#ececec' : '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {session.title}
                    </span>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2, borderRadius: 4, flexShrink: 0, display: 'flex', opacity: 0, transition: 'opacity 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.opacity = '0'; }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Uploaded docs */}
        {uploadedDocs.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Documents</p>
            {uploadedDocs.map((doc, i) => (
              <div key={i} style={{ fontSize: 12, color: '#888', padding: '3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📄 {doc}
              </div>
            ))}
          </div>
        )}

        {/* GitHub */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a2a' }}>
          <a href="https://github.com/gaurav0630/autoflow" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#555', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ececec')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            <Github size={15} /> GitHub
          </a>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
          {messages.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.5px' }}>How can I help you today?</h2>
              <p style={{ fontSize: 15, color: '#888', marginBottom: 32, maxWidth: 400 }}>Define a goal and AutoFlow will reason, search, and execute it. Upload a PDF to ask questions from your documents.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 640 }}>
                {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setInputValue(prompt.text); textareaRef.current?.focus(); }}
                    style={{ padding: '12px 16px', background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 12, color: '#ccc', fontSize: 13, cursor: 'pointer', textAlign: 'left', maxWidth: 200, lineHeight: 1.4 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.color = '#ececec'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.color = '#ccc'; }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{prompt.icon}</div>
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
              {messages.map((message) => (
                <div key={message.id} style={{ marginBottom: 24, display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start', gap: 12, alignItems: 'flex-start' }}>
                  {message.type === 'agent' && (
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginTop: 2 }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: '80%', padding: '10px 16px',
                    borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: message.type === 'user' ? '#2563eb' : '#2a2a2a',
                    color: '#ececec', fontSize: 14, lineHeight: 1.6,
                  }}>
                    {message.attachedFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}>
                        📄 {message.attachedFile}
                      </div>
                    )}
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 11, opacity: 0.4 }}>{new Date(message.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
                  <div style={{ padding: '12px 16px', background: '#2a2a2a', borderRadius: '18px 18px 18px 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#888' }}>{isUploading ? 'Uploading document...' : 'Agent is reasoning'}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#555', display: 'inline-block', animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px 24px', background: '#212121' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ background: '#2a2a2a', border: '1px solid #3a3a3a', borderRadius: 16, overflow: 'hidden' }}>

              {pendingFile && (
                <div style={{ padding: '10px 14px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a1a2e', border: '1px solid #2563eb40', borderRadius: 8, padding: '6px 10px' }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#ececec', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#666' }}>{(pendingFile.size / 1024).toFixed(0)} KB · PDF</p>
                    </div>
                    <button onClick={() => setPendingFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', padding: 2 }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={pendingFile ? 'Ask about this document, or press send to summarize...' : 'Message AutoFlow...'}
                rows={1}
                style={{ width: '100%', padding: '14px 16px 10px', background: 'transparent', border: 'none', outline: 'none', color: '#ececec', fontSize: 15, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 10px' }}>
                <div>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    style={{ padding: '6px 10px', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#aaa'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#666'; }}
                  >
                    <Paperclip size={16} /> Attach PDF
                  </button>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  style={{ width: 34, height: 34, borderRadius: 8, background: canSend ? '#ececec' : '#3a3a3a', border: 'none', cursor: canSend ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: canSend ? '#212121' : '#555' }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 10 }}>AutoFlow can make mistakes. Verify important information.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 3px; }
      `}</style>
    </div>
  );
}