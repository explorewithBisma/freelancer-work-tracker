import React, { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import "./chatwidget.css";

const BotIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SUGGESTIONS = [
  "What is my project status?",
  "How many tasks are pending?",
  "Show my earnings",
  "Give me a summary",
];

export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hello! I am your FWT Assistant 👋\nAsk me about your projects, tasks, earnings, or time tracking!" }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await api.post("/chat/message", { message: msg });
      const reply = res.data.reply;
      setMessages(prev => [...prev, { from: "bot", text: reply }]);
      if (!open) setUnread(u => u + 1);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Sorry, kuch masla ho gaya. Dobara try karein!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="cw-root">
      {/* Chat Window */}
      {open && (
        <div className="cw-window">
          {/* Header */}
          <div className="cw-header">
            <div className="cw-header-left">
              <div className="cw-avatar"><BotIcon /></div>
              <div>
                <div className="cw-bot-name">FWT Assistant</div>
                <div className="cw-bot-status"><span className="cw-dot"/>Online</div>
              </div>
            </div>
            <button className="cw-close-btn" onClick={() => setOpen(false)}><CloseIcon /></button>
          </div>

          {/* Messages */}
          <div className="cw-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cw-msg ${m.from}`}>
                {m.from === "bot" && <div className="cw-msg-avatar"><BotIcon /></div>}
                <div className="cw-msg-bubble">
                  {m.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < m.text.split("\n").length - 1 && <br/>}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="cw-msg bot">
                <div className="cw-msg-avatar"><BotIcon /></div>
                <div className="cw-typing">
                  <span/><span/><span/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Suggestions */}
          <div className="cw-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="cw-suggestion" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>

          {/* Input */}
          <div className="cw-input-row">
            <textarea
              className="cw-input"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button className="cw-send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button className="cw-fab" onClick={() => setOpen(!open)}>
        {open ? <CloseIcon /> : <BotIcon />}
        {!open && unread > 0 && <span className="cw-badge">{unread}</span>}
      </button>
    </div>
  );
}