import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./clientportal.css";
import ClientChatWidget from "./ClientChatWidget";

export default function ClientPortal() {
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [pdfInvoice, setPdfInvoice] = useState(null);

  const token = localStorage.getItem("client_token");

  useEffect(() => {
    if (!token) { navigate("/client-login"); return; }
    api.get("/client-portal/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setData(res.data))
      .catch(() => { setError("Session expired. Please login again."); localStorage.removeItem("client_token"); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => { localStorage.removeItem("client_token"); navigate("/client-login"); };

  const statusColor = (s) => s === "active" ? "green" : s === "completed" ? "blue" : "orange";
  const statusLabel = (s) => s === "active" ? "Active" : s === "completed" ? "Completed" : "On Hold";

  if (loading) return <div className="cp-loading"><div className="cp-spinner"/><p>Loading your portal...</p></div>;
  if (error)   return <div className="cp-error"><p>{error}</p><button onClick={() => navigate("/client-login")}>Login Again</button></div>;

  const { client, summary, projects, invoices } = data;

  return (
    <div className="cp-wrap">

      {/* Header */}
      <header className="cp-header">
        <div className="cp-brand">
          <div className="cp-brand-dot">C</div>
          <span className="cp-brand-name">Client Portal</span>
        </div>
        <div className="cp-brand-center">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <line x1="20" y1="10" x2="10" y2="30" stroke="white" strokeWidth="2"/>
            <line x1="20" y1="10" x2="30" y2="30" stroke="white" strokeWidth="2"/>
            <line x1="10" y1="30" x2="30" y2="30" stroke="white" strokeWidth="2"/>
            <circle cx="20" cy="10" r="3" fill="white"/>
            <circle cx="10" cy="30" r="3" fill="white"/>
            <circle cx="30" cy="30" r="3" fill="white"/>
          </svg>
          <span className="cp-center-text">FWT</span>
        </div>
        <div className="cp-header-right">
          <div className="cp-user">
            <div className="cp-user-avatar">{client.name.charAt(0)}</div>
            <div>
              <p className="cp-user-name">{client.name}</p>
              <p className="cp-user-company">{client.company || client.email}</p>
            </div>
          </div>
          <button className="cp-logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <div className="cp-body">

        {/* Welcome */}
        <div className="cp-welcome">
          <h1>Welcome back, <span>{client.name.split(" ")[0]}</span>!</h1>
          <p>Here's an overview of your projects and invoices.</p>
        </div>

        {/* Summary Cards */}
        <div className="cp-summary">
          {[
            { label: "Total Projects",  value: summary.total_projects },
            { label: "Tasks Completed", value: `${summary.completed_tasks}/${summary.total_tasks}` },
            { label: "Hours Logged",    value: `${summary.hours_logged}h` },
            { label: "Pending Amount",  value: `$${summary.pending_amount.toLocaleString()}` },
          ].map(s => (
            <div key={s.label} className="cp-sum-card">
              <p className="cp-sum-num">{s.value}</p>
              <p className="cp-sum-label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <section className="cp-section">
          <h2>Your Projects</h2>
          {projects.length === 0 ? (
            <div className="cp-empty"><p>No projects assigned yet.</p></div>
          ) : (
            <div className="cp-projects">
              {projects.map(p => (
                <div key={p.id} className="cp-project-card">
                  <div className="cp-project-top">
                    <h3>{p.title}</h3>
                    <span className={`cp-badge ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                  </div>
                  {p.description && <p className="cp-project-desc">{p.description}</p>}
                  <div className="cp-progress-wrap">
                    <div className="cp-progress-info">
                      <span>Progress</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="cp-progress-bar">
                      <div className="cp-progress-fill" style={{ width: `${p.progress}%` }}/>
                    </div>
                    <p className="cp-progress-sub">{p.done_tasks} of {p.total_tasks} tasks completed</p>
                  </div>
                  {p.hourly_rate && <p className="cp-project-rate">Rate: ${p.hourly_rate}/hr</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Invoices */}
        <section className="cp-section">
          <h2>Your Invoices</h2>
          {invoices.length === 0 ? (
            <div className="cp-empty"><p>No invoices yet.</p></div>
          ) : (
            <div className="cp-invoice-table">
              <table>
                <thead>
                  <tr><th>Invoice #</th><th>Period</th><th>Amount</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={i}>
                      <td><strong>{inv.invoice_number}</strong></td>
                      <td>{inv.date_from} → {inv.date_to}</td>
                      <td><strong>${inv.total_amount.toLocaleString()}</strong></td>
                      <td>
                        <span className={`cp-badge ${inv.status === "paid" ? "blue" : "orange"}`}>
                          {inv.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setPdfInvoice(inv)}
                          style={{ background: "#ede9fe", color: "#7c3aed", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          📄 View PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* ── PDF Modal ── */}
      {pdfInvoice && (
        <div
          className="pdf-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,14,26,0.65)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 24
          }}
        >
          <div
            className="pdf-modal"
            style={{
              background: "#f4f4f0",
              borderRadius: 20,
              maxWidth: 640,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 48px 100px rgba(10,14,26,0.35)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 20px 0" }}>
              <button onClick={() => window.print()} style={{ padding: "9px 18px", background: "#1a1040", color: "white", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                🖨️ Print
              </button>
              <button onClick={() => setPdfInvoice(null)} style={{ padding: "9px 16px", background: "#e5e5e0", color: "#555", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                ✕ Close
              </button>
            </div>

            <div
              className="pdf-doc"
              style={{
                background: "white",
                margin: 16,
                borderRadius: 14,
                padding: 40,
                boxShadow: "0 4px 20px rgba(10,14,26,0.08)"
              }}
            >
              {/* Invoice Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#1a1040", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>FW</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1040" }}>Freelancer Work Tracker</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>fwtapp860@gmail.com</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "#1a1040", marginBottom: 8 }}>{pdfInvoice.invoice_number}</div>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", padding: "4px 12px", borderRadius: 999, background: pdfInvoice.status === "paid" ? "#dcfce7" : "#fef3c7", color: pdfInvoice.status === "paid" ? "#15803d" : "#92400e" }}>
                    {pdfInvoice.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: "#e8e8e4", marginBottom: 28 }}/>

              {/* Bill To */}
              <div style={{ display: "flex", gap: 40, marginBottom: 28 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: "#aaa", marginBottom: 8 }}>Bill To</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1040" }}>{client.name}</div>
                  {client.company && <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{client.company}</div>}
                  <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>{client.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.8, color: "#aaa", marginBottom: 8 }}>Period</div>
                  <div style={{ fontSize: 13, color: "#444" }}>From: <strong>{pdfInvoice.date_from}</strong></div>
                  <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>To: <strong>{pdfInvoice.date_to}</strong></div>
                </div>
              </div>

              {/* Amount */}
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 32, padding: "16px 18px", background: "#1a1040", borderRadius: 12, marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "rgba(255,255,255,0.55)" }}>Total Amount</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "white" }}>${pdfInvoice.total_amount.toLocaleString()}</div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: "center", paddingTop: 16, borderTop: "1px solid #e8e8e4" }}>
                <div style={{ fontSize: 15, color: "#444", marginBottom: 4 }}>Thank you for your business! 🙏</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>Generated by Freelancer Work Tracker</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ClientChatWidget clientData={data} />
    </div>
  );
}