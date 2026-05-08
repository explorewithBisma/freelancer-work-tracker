import React, { useState, useRef, useEffect } from "react";
import "../components/chatwidget.css";

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
  "How many tasks are done?",
  "Show my invoices",
  "Give me a summary",
];

const BACKEND_URL = "http://127.0.0.1:8000";

export default function ClientChatWidget({ clientData }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: `Hello${clientData?.client?.name ? ", " + clientData.client.name.split(" ")[0] : ""}! I am your Portal Assistant.\nAsk me anything about your projects, tasks, invoices, or hours logged.` }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread]   = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, messages]);

  // ✅ Build context from clientData and send to Gemini via backend
  const buildClientContext = () => {
    const { client, summary, projects, invoices } = clientData || {};
    let ctx = `CLIENT PORTAL DATA:\n`;
    ctx += `Client Name: ${client?.name || "Unknown"}\n`;
    ctx += `Company: ${client?.company || "N/A"}\n\n`;
    ctx += `SUMMARY:\n`;
    ctx += `  Total Projects: ${summary?.total_projects || 0}\n`;
    ctx += `  Tasks Completed: ${summary?.completed_tasks || 0} / ${summary?.total_tasks || 0}\n`;
    ctx += `  Hours Logged: ${summary?.hours_logged || 0}h\n`;
    ctx += `  Pending Amount: $${summary?.pending_amount || 0}\n\n`;
    ctx += `PROJECTS:\n`;
    (projects || []).forEach(p => {
      ctx += `  - ${p.title} | Status: ${p.status} | Progress: ${p.progress}% | Tasks: ${p.done_tasks}/${p.total_tasks} done\n`;
    });
    ctx += `\nINVOICES:\n`;
    (invoices || []).forEach(i => {
      ctx += `  - ${i.invoice_number} | $${i.total_amount} | ${i.status}\n`;
    });
    return ctx;
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: msg }]);
    setLoading(true);

    try {
      // ✅ Send to backend Gemini endpoint with client context embedded in message
      const clientContext = buildClientContext();
      const enrichedMessage = `[CLIENT PORTAL CONTEXT]\n${clientContext}\n[USER QUESTION]\n${msg}`;

      const token = localStorage.getItem("client_token");
      const res = await fetch(`${BACKEND_URL}/chat/client-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: enrichedMessage, context: clientContext })
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMessages(prev => [...prev, { from: "bot", text: data.reply }]);
    } catch {
      // Fallback to rule-based if API fails
      const reply = getRuleBasedResponse(msg);
      setMessages(prev => [...prev, { from: "bot", text: reply }]);
    } finally {
      setLoading(false);
      if (!open) setUnread(u => u + 1);
    }
  };

  // Fallback rule-based responses
  const getRuleBasedResponse = (msg) => {
    const m = msg.toLowerCase();
    const { summary, projects, invoices } = clientData || {};
    const any = (words) => words.some(w => m.includes(w));

    if (any(["project","status","work"])) {
      if (!projects?.length) return "No projects assigned yet.";
      return projects.map(p => `${p.title}\nStatus: ${p.status} | Progress: ${p.progress}%\n${p.done_tasks}/${p.total_tasks} tasks done`).join("\n---\n");
    }
    if (any(["task","done","complete","pending"])) {
      return `Tasks: ${summary?.completed_tasks || 0} completed out of ${summary?.total_tasks || 0} total.`;
    }
    if (any(["invoice","payment","paid","amount"])) {
      if (!invoices?.length) return "No invoices yet.";
      const paid = invoices.filter(i => i.status === "paid").length;
      return `Invoices: ${invoices.length} total, ${paid} paid.\nPending amount: $${summary?.pending_amount || 0}`;
    }
    if (any(["hour","time","logged"])) {
      return `Hours logged: ${summary?.hours_logged || 0} hours total.`;
    }
    if (any(["summary","overview","all"])) {
      return `Overview:\nProjects: ${summary?.total_projects || 0}\nTasks: ${summary?.completed_tasks || 0}/${summary?.total_tasks || 0} done\nHours: ${summary?.hours_logged || 0}h\nPending: $${summary?.pending_amount || 0}`;
    }
    return "I can answer questions about your projects, tasks, invoices, and hours logged.";
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="cw-root">
      {open && (
        <div className="cw-window">
          <div className="cw-header" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            <div className="cw-header-left">
              <div className="cw-avatar"><BotIcon /></div>
              <div>
                <div className="cw-bot-name">Portal Assistant</div>
                <div className="cw-bot-status"><span className="cw-dot"/>Online</div>
              </div>
            </div>
            <button className="cw-close-btn" onClick={() => setOpen(false)}><CloseIcon /></button>
          </div>

          <div className="cw-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cw-msg ${m.from}`}>
                {m.from === "bot" && (
                  <div className="cw-msg-avatar" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                    <BotIcon />
                  </div>
                )}
                <div className="cw-msg-bubble">
                  {m.text.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < m.text.split("\n").length - 1 && <br/>}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="cw-msg bot">
                <div className="cw-msg-avatar" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
                  <BotIcon />
                </div>
                <div className="cw-typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="cw-suggestions">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="cw-suggestion"
                style={{ background: "#ede9fe", color: "#7c3aed" }}
                onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>

          <div className="cw-input-row">
            <textarea className="cw-input" placeholder="Ask about your project..."
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey} rows={1}/>
            <button className="cw-send-btn"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      <button className="cw-fab"
        style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
        onClick={() => setOpen(!open)}>
        {open ? <CloseIcon /> : <BotIcon />}
        {!open && unread > 0 && <span className="cw-badge">{unread}</span>}
      </button>
    </div>
  );
}