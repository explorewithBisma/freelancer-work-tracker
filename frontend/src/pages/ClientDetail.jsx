import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./clientdetail.css";

const Icons = {
  back:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  email:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6.72 6.72l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  company: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  folder:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  task:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  invoice: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  clock:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  deadline:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  portal:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
};

const statusColor = (s) => s === "active" ? "green" : s === "completed" ? "blue" : s === "on_hold" ? "orange" : "gray";
const statusLabel = (s) => s === "active" ? "Active" : s === "completed" ? "Completed" : s === "on_hold" ? "On Hold" : s;
const priorityColor = (p) => p === "high" ? "red" : p === "medium" ? "orange" : "green";

const getDaysLeft = (deadline) => {
  if (!deadline) return null;
  const today = new Date();
  const dl = new Date(deadline);
  const diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
  return diff;
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient]     = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);

  // ✅ Portal Access Modal state
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [portalPassword, setPortalPassword]   = useState("");
  const [portalLoading, setPortalLoading]     = useState(false);
  const [portalMsg, setPortalMsg]             = useState(null); // {type: "success"|"error", text}

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes, tRes, iRes] = await Promise.all([
          api.get(`/clients/${id}`),
          api.get("/projects/"),
          api.get("/tasks/"),
          api.get("/invoices"),
        ]);
        setClient(cRes.data);
        const clientProjects = (pRes.data || []).filter(p => String(p.client_id) === String(id));
        const projectIds = clientProjects.map(p => p.id);
        setProjects(clientProjects);
        setTasks((tRes.data || []).filter(t => projectIds.includes(t.project_id)));
        setInvoices((iRes.data || []).filter(i => String(i.client_id) === String(id)));
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  // ✅ Portal Access handler — client_id bhejta hai email nahi
  const handlePortalAccess = async () => {
    if (!portalPassword.trim()) {
      setPortalMsg({ type: "error", text: "Password enter karo!" });
      return;
    }
    setPortalLoading(true);
    setPortalMsg(null);
    try {
      await api.post("/client-portal/set-password", {
        client_id: Number(id),   // ✅ client_id — exact client milega
        password:  portalPassword,
      });
      setPortalMsg({ type: "success", text: `✅ Portal access email ${client.email} pe bhej diya gaya!` });
      setPortalPassword("");
      setTimeout(() => {
        setShowPortalModal(false);
        setPortalMsg(null);
      }, 2500);
    } catch (err) {
      setPortalMsg({ type: "error", text: err.response?.data?.detail || "Failed to set portal access." });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) return <div className="cd-loading"><div className="cd-spinner"/><p>Loading client...</p></div>;
  if (!client) return <div className="cd-loading"><p>Client not found.</p></div>;

  const totalEarned  = invoices.filter(i => i.status === "paid").reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const totalPending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const doneTasks    = tasks.filter(t => t.status === "done").length;

  return (
    <div className="cd-wrap">

      {/* ✅ Portal Access Modal */}
      {showPortalModal && (
        <div className="pj-modal-overlay" onClick={() => { setShowPortalModal(false); setPortalMsg(null); setPortalPassword(""); }}>
          <div className="pj-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
            <h3>Grant Portal Access</h3>
            <p style={{ fontSize: 13, color: "#7c6faa", marginBottom: 16 }}>
              Set a password for <strong>{client.name}</strong> — they will receive login details at <strong>{client.email}</strong>
            </p>
            <input
              type="password"
              placeholder="Set portal password"
              value={portalPassword}
              onChange={e => setPortalPassword(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #e2d9f3", fontSize: 14, marginBottom: 12,
                outline: "none", boxSizing: "border-box"
              }}
            />
            {portalMsg && (
              <p style={{
                fontSize: 13, marginBottom: 12, padding: "8px 12px", borderRadius: 8,
                background: portalMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                color: portalMsg.type === "success" ? "#16a34a" : "#dc2626",
              }}>
                {portalMsg.text}
              </p>
            )}
            <div className="pj-modal-actions">
              <button className="pj-modal-cancel" onClick={() => { setShowPortalModal(false); setPortalMsg(null); setPortalPassword(""); }}>
                Cancel
              </button>
              <button
                className="pj-modal-confirm"
                onClick={handlePortalAccess}
                disabled={portalLoading}
                style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
              >
                {portalLoading ? "Sending..." : "Send Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="cd-header">
        <button className="cd-back-btn" onClick={() => navigate("/clients")}>
          {Icons.back} Back to Clients
        </button>
        <div className="cd-hero">
          <div className="cd-avatar">{client.name.charAt(0).toUpperCase()}</div>
          <div className="cd-hero-info">
            <h1 className="cd-name">{client.name}</h1>
            {client.company && <p className="cd-company">{Icons.company} {client.company}</p>}
            <div className="cd-contacts">
              {client.email && <span>{Icons.email} {client.email}</span>}
              {client.phone && <span>{Icons.phone} {client.phone}</span>}
            </div>
            {/* ✅ Portal Access Button */}
            <button
              onClick={() => setShowPortalModal(true)}
              style={{
                marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6,
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                color: "white", border: "none", borderRadius: 10,
                padding: "8px 16px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
              }}
            >
              {Icons.portal} Grant Portal Access
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="cd-stats">
        {[
          { label: "Total Projects",  value: projects.length },
          { label: "Total Tasks",     value: tasks.length },
          { label: "Tasks Done",      value: doneTasks },
          { label: "Total Earned",    value: `$${totalEarned.toLocaleString()}` },
          { label: "Pending Amount",  value: `$${totalPending.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="cd-stat-card">
            <p className="cd-stat-val">{s.value}</p>
            <p className="cd-stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="cd-body">

        {/* Projects */}
        <section className="cd-section">
          <h2 className="cd-section-title">{Icons.folder} Projects</h2>
          {projects.length === 0 ? (
            <div className="cd-empty">No projects for this client yet.</div>
          ) : (
            <div className="cd-project-list">
              {projects.map(p => {
                const daysLeft = getDaysLeft(p.deadline);
                const projectTasks = tasks.filter(t => t.project_id === p.id);
                const donePT = projectTasks.filter(t => t.status === "done").length;
                const progress = projectTasks.length > 0 ? Math.round(donePT / projectTasks.length * 100) : 0;
                return (
                  <div key={p.id} className="cd-project-card">
                    <div className="cd-project-top">
                      <h3>{p.title}</h3>
                      <span className={`cd-badge ${statusColor(p.status)}`}>{statusLabel(p.status)}</span>
                    </div>
                    {p.description && <p className="cd-project-desc">{p.description}</p>}

                    {p.deadline && (
                      <div className={`cd-deadline ${daysLeft < 0 ? "overdue" : daysLeft <= 7 ? "urgent" : ""}`}>
                        {Icons.deadline}
                        <span>Deadline: {new Date(p.deadline).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</span>
                        <span className="cd-days-left">
                          {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? "Due today!" : `${daysLeft} days left`}
                        </span>
                      </div>
                    )}

                    <div className="cd-progress">
                      <div className="cd-progress-info">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="cd-progress-bar">
                        <div className="cd-progress-fill" style={{ width: `${progress}%` }}/>
                      </div>
                      <p className="cd-progress-sub">{donePT}/{projectTasks.length} tasks completed</p>
                    </div>

                    {p.hourly_rate && <p className="cd-rate">{Icons.clock} ${p.hourly_rate}/hr</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tasks */}
        <section className="cd-section">
          <h2 className="cd-section-title">{Icons.task} Tasks</h2>
          {tasks.length === 0 ? (
            <div className="cd-empty">No tasks found for this client's projects.</div>
          ) : (
            <div className="cd-task-list">
              {tasks.map(t => {
                const proj = projects.find(p => p.id === t.project_id);
                return (
                  <div key={t.id} className="cd-task-row">
                    <div className="cd-task-left">
                      <span className={`cd-priority-dot ${priorityColor(t.priority)}`}/>
                      <div>
                        <p className="cd-task-title">{t.title}</p>
                        <p className="cd-task-proj">{proj?.title || "Unknown Project"}</p>
                      </div>
                    </div>
                    <span className={`cd-badge ${statusColor(t.status)}`}>{statusLabel(t.status)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Invoices */}
        <section className="cd-section">
          <h2 className="cd-section-title">{Icons.invoice} Invoices</h2>
          {invoices.length === 0 ? (
            <div className="cd-empty">No invoices for this client yet.</div>
          ) : (
            <div className="cd-invoice-table">
              <table>
                <thead>
                  <tr><th>Invoice #</th><th>Period</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td><strong>{inv.invoice_number}</strong></td>
                      <td>{inv.date_from} → {inv.date_to}</td>
                      <td><strong>${parseFloat(inv.total_amount).toLocaleString()}</strong></td>
                      <td><span className={`cd-badge ${inv.status === "paid" ? "blue" : inv.status === "sent" ? "orange" : "gray"}`}>{inv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}