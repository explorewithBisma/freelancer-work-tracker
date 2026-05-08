import React, { useState, useRef, useEffect } from "react";

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
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

const SUGGESTIONS = ["What is FWT?", "Is it free?", "How do I get started?", "Tell me a joke!"];

export default function LandingChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm the FWT Assistant powered by AI.\nAsk me anything!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
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
      const res = await fetch("http://localhost:8000/chat/landing-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { from: "bot", text: data.reply || "Sorry, I couldn't get a response!" }]);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Connection error. Please try again!" }]);
    }
    if (!open) setUnread(u => u + 1);
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, fontFamily: "'Sora', sans-serif" }}>
      {open && (
        <div style={{ position: "absolute", bottom: 70, right: 0, width: 340, height: 500, background: "white", borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
          <div style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                <BotIcon />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>FWT Assistant</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }}/>
                  AI Powered
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CloseIcon />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: "#f8f7ff" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: m.from === "user" ? "row-reverse" : "row" }}>
                {m.from === "bot" && (
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BotIcon />
                  </div>
                )}
                <div style={{ maxWidth: "75%", padding: "9px 13px", borderRadius: 14, fontSize: 12.5, lineHeight: 1.55, background: m.from === "bot" ? "white" : "linear-gradient(135deg, #7c3aed, #ec4899)", color: m.from === "bot" ? "#1a1040" : "white", boxShadow: m.from === "bot" ? "0 2px 8px rgba(0,0,0,0.06)" : "none", borderBottomLeftRadius: m.from === "bot" ? 4 : 14, borderBottomRightRadius: m.from === "user" ? 4 : 14 }}>
                  {m.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < m.text.split("\n").length - 1 && <br/>}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BotIcon />
                </div>
                <div style={{ background: "white", padding: "12px 16px", borderRadius: 14, borderBottomLeftRadius: 4, display: "flex", gap: 4, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#b0a8cc", display: "inline-block", animation: `bounce 1.2s infinite ${i * 0.2}s` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div style={{ padding: "8px 10px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid #f0eeff", background: "white" }}>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)} style={{ background: "#f0eeff", color: "#7c3aed", border: "none", borderRadius: 999, padding: "4px 11px", fontSize: 10.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{s}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: "1px solid #f0eeff", background: "white", alignItems: "flex-end" }}>
            <textarea
              style={{ flex: 1, border: "1.5px solid rgba(124,58,237,0.15)", borderRadius: 12, padding: "9px 12px", fontFamily: "inherit", fontSize: 12.5, color: "#1a1040", outline: "none", resize: "none", maxHeight: 70, background: "#f8f7ff" }}
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() || loading ? 0.4 : 1 }}>
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setOpen(!open)} style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #ec4899)", color: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(124,58,237,0.40)", position: "relative" }}>
        {open ? <CloseIcon /> : <BotIcon />}
        {!open && unread > 0 && (
          <span style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", color: "white", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white" }}>
            {unread}
          </span>
        )}
      </button>

      <style>{`
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
      `}</style>
    </div>
  );
}