import { useEffect, useState } from "react";
import { getProjects, createProject, deleteProject, updateProject } from "../api/projectApi";
import api from "../api/axios";
import "./projects.css";

const Icons = {
  folder:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  active:  <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#22c55e"/></svg>,
  hold:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  done:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  total:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  rate:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  client:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  calendar:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  edit:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  warn:    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  empty:   <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>,
  plus:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  closeP:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/><circle cx="12" cy="12" r="10"/></svg>,
};

const STATUS_CONFIG = {
  active:    { label: "Active",    colorClass: "green",  icon: Icons.active },
  completed: { label: "Completed", colorClass: "blue",   icon: Icons.done },
  on_hold:   { label: "On Hold",   colorClass: "orange", icon: Icons.hold },
};

const EMPTY_FORM = { clientId: "", title: "", description: "", hourlyRate: "", status: "active", deadline: "" };

export default function Projects() {
  const [projects, setProjects]             = useState([]);
  const [clients, setClients]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [showForm, setShowForm]             = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filterStatus, setFilterStatus]     = useState("all");
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [closeConfirm, setCloseConfirm]     = useState(null);
  const [formData, setFormData]             = useState(EMPTY_FORM);
  const [autoInvoiceMsg, setAutoInvoiceMsg] = useState(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data || []);
    } catch {
      alert("Could not load projects.");
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data || []);
    } catch { }
  };

  useEffect(() => { loadProjects(); loadClients(); }, []);

  const openCreate = () => {
    setEditingProject(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setFormData({
      clientId:    String(project.client_id || ""),
      title:       project.title || "",
      description: project.description || "",
      hourlyRate:  String(project.hourly_rate || ""),
      status:      project.status || "active",
      deadline:    project.deadline || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      client_id:   Number(formData.clientId),
      title:       formData.title,
      description: formData.description || null,
      hourly_rate: formData.hourlyRate ? Number(formData.hourlyRate) : null,
      status:      formData.status || "active",
      deadline:    formData.deadline || null,
    };
    try {
      let res;
      if (editingProject) {
        res = await updateProject(editingProject.id, payload);
      } else {
        res = await createProject(payload);
      }
      setFormData(EMPTY_FORM);
      setShowForm(false);
      setEditingProject(null);
      loadProjects();

      // ✅ Show auto invoice notification
      if (res?.auto_invoice) {
        setAutoInvoiceMsg(res.auto_invoice);
        setTimeout(() => setAutoInvoiceMsg(null), 6000);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch {
      alert("Failed to delete project");
    }
  };

  // ✅ FIXED: handleCloseProject — auto invoice notification show karta hai
  const handleCloseProject = async (id) => {
    try {
      const res = await api.delete(`/projects/${id}/close`);
      setProjects(projects.filter(p => p.id !== id));
      setCloseConfirm(null);

      // ✅ Show auto invoice notification if invoice was created
      if (res.data?.auto_invoice) {
        setAutoInvoiceMsg(res.data.auto_invoice);
        setTimeout(() => setAutoInvoiceMsg(null), 6000);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to close project");
    }
  };

  const getDeadlineInfo = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const dl = new Date(deadline);
    const diff = Math.ceil((dl - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `Overdue by ${Math.abs(diff)} days`, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" };
    if (diff <= 7) return { label: `${diff} days left`, color: "#d97706", bg: "#fffbeb", border: "#fde68a" };
    return { label: `${diff} days left`, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" };
  };

  const filtered = filterStatus === "all"
    ? projects
    : projects.filter(p => p.status === filterStatus);

  const clientName = (id) => {
    const c = clients.find(c => c.id === id);
    return c ? c.name : `Client #${id}`;
  };

  return (
    <div className="pj-wrap">

      {/* ✅ Auto Invoice Notification Banner */}
      {autoInvoiceMsg && (
        <div style={{
          position: "fixed", top: 80, right: 24, zIndex: 9999,
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
          color: "white", borderRadius: 16, padding: "16px 20px",
          boxShadow: "0 8px 32px rgba(124,58,237,0.35)",
          maxWidth: 340, animation: "cardPop 0.3s ease both"
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🎉 Invoice Auto-Generated!</div>
          <div style={{ fontSize: 12, opacity: 0.9 }}>{autoInvoiceMsg.message}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Amount: ${autoInvoiceMsg.amount}</div>
          <button onClick={() => setAutoInvoiceMsg(null)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "white", fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="pj-header">
        <div className="pj-header-left">
          <p className="pj-eyebrow">Project Management</p>
          <h1 className="pj-title">Your Projects</h1>
          <p className="pj-sub">Create, track and manage all your freelance projects.</p>
        </div>
        <button className="pj-new-btn" onClick={showForm ? () => { setShowForm(false); setEditingProject(null); } : openCreate}>
          {showForm ? <>{Icons.close} Cancel</> : <>{Icons.plus} New Project</>}
        </button>
      </div>

      {/* Stats */}
      <div className="pj-stats-row">
        {[
          { label: "Total",     value: projects.length,                                   icon: Icons.total,  color: "purple" },
          { label: "Active",    value: projects.filter(p=>p.status==="active").length,    icon: Icons.active, color: "green"  },
          { label: "On Hold",   value: projects.filter(p=>p.status==="on_hold").length,   icon: Icons.hold,   color: "orange" },
          { label: "Completed", value: projects.filter(p=>p.status==="completed").length, icon: Icons.done,   color: "blue"   },
        ].map(s => (
          <div key={s.label} className={`pj-stat-card ${s.color}`}>
            <span className="pj-stat-icon">{s.icon}</span>
            <div>
              <p className="pj-stat-num">{s.value}</p>
              <p className="pj-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className={`pj-form-wrap ${showForm ? "open" : ""}`}>
        <div className="pj-form-inner">
          <h3 className="pj-form-title">{editingProject ? "Edit Project" : "Create New Project"}</h3>
          <form onSubmit={handleSubmit} className="pj-form">
            <div className="pj-form-grid">
              <div className="pj-field-wrap">
                <label className="pj-label">Client</label>
                <div className="pj-field">
                  <span className="pj-field-icon">{Icons.client}</span>
                  <select required value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}>
                    <option value="">Select a client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="pj-field-wrap">
                <label className="pj-label">Project Title</label>
                <div className="pj-field">
                  <span className="pj-field-icon">{Icons.folder}</span>
                  <input type="text" placeholder="e.g. Landing Page Redesign" required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}/>
                </div>
              </div>
              <div className="pj-field-wrap">
                <label className="pj-label">Hourly Rate ($)</label>
                <div className="pj-field">
                  <span className="pj-field-icon">{Icons.rate}</span>
                  <input type="number" placeholder="e.g. 50" min="0"
                    value={formData.hourlyRate}
                    onChange={e => setFormData({...formData, hourlyRate: e.target.value})}/>
                </div>
              </div>
              <div className="pj-field-wrap">
                <label className="pj-label">Status</label>
                <div className="pj-field">
                  <span className="pj-field-icon">{Icons.active}</span>
                  <select value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="pj-field-wrap">
                <label className="pj-label">Deadline (Optional)</label>
                <div className="pj-field">
                  <span className="pj-field-icon">{Icons.calendar}</span>
                  <input type="date" value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}/>
                </div>
              </div>
            </div>
            <div className="pj-field-wrap" style={{marginTop:14}}>
              <label className="pj-label">Description</label>
              <textarea className="pj-textarea" placeholder="Describe the project scope..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}/>
            </div>
            <button type="submit" className="pj-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
            </button>
          </form>
        </div>
      </div>

      {/* Filter */}
      <div className="pj-filter-row">
        <div className="pj-filter-tabs">
          {["all","active","on_hold","completed"].map(f => (
            <button key={f} className={`pj-filter-btn ${filterStatus===f?"active":""}`}
              onClick={() => setFilterStatus(f)}>
              {f === "all" ? "All Projects" : STATUS_CONFIG[f]?.label}
            </button>
          ))}
        </div>
        <p className="pj-count">{filtered.length} project{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="pj-loading"><div className="pj-spinner"/><p>Loading projects...</p></div>
      ) : filtered.length === 0 ? (
        <div className="pj-empty">
          <span className="pj-empty-icon">{Icons.empty}</span>
          <h3>No projects found</h3>
          <p>{filterStatus === "all" ? "Create your first project using the button above." : `No ${STATUS_CONFIG[filterStatus]?.label.toLowerCase()} projects yet.`}</p>
        </div>
      ) : (
        <div className="pj-grid">
          {filtered.map((project, i) => {
            const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
            const deadlineInfo = getDeadlineInfo(project.deadline);
            return (
              <div key={project.id} className="pj-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="pj-card-top">
                  <div className="pj-card-icon-wrap">{Icons.folder}</div>
                  <span className={`pj-status-badge ${cfg.colorClass}`}>{cfg.icon} {cfg.label}</span>
                </div>
                <h3 className="pj-card-title">{project.title}</h3>
                <p className="pj-card-desc">{project.description || "No description provided."}</p>

                {deadlineInfo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: deadlineInfo.color, background: deadlineInfo.bg, border: `1px solid ${deadlineInfo.border}`, borderRadius: 8, padding: "6px 10px", marginTop: 8 }}>
                    {Icons.calendar} Deadline: {new Date(project.deadline).toLocaleDateString()} — {deadlineInfo.label}
                  </div>
                )}

                <div className="pj-card-meta">
                  <div className="pj-meta-item">{Icons.rate}<span>${project.hourly_rate || 0}/hr</span></div>
                  <div className="pj-meta-item">{Icons.client}<span>{clientName(project.client_id)}</span></div>
                </div>
                <div className="pj-card-divider"/>
                <div className="pj-card-actions">
                  <button className="pj-edit-btn" onClick={() => openEdit(project)}>{Icons.edit} Edit</button>
                  <button className="pj-delete-btn" onClick={() => setDeleteConfirm(project.id)}>{Icons.trash} Delete</button>
                </div>
                <button className="pj-close-btn" onClick={() => setCloseConfirm(project)}>
                  {Icons.closeP} Close Project
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="pj-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="pj-modal" onClick={e => e.stopPropagation()}>
            <div className="pj-modal-icon">{Icons.warn}</div>
            <h3>Delete Project?</h3>
            <p>This action cannot be undone. The project and all related data will be permanently removed.</p>
            <div className="pj-modal-actions">
              <button className="pj-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="pj-modal-confirm" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Project Modal */}
      {closeConfirm && (
        <div className="pj-modal-overlay" onClick={() => setCloseConfirm(null)}>
          <div className="pj-modal" onClick={e => e.stopPropagation()}>
            <div className="pj-modal-icon" style={{ color: "#7c3aed" }}>{Icons.closeP}</div>
            <h3>Close Project?</h3>
            <p>This will permanently remove <strong>"{closeConfirm.title}"</strong> and all of its:</p>
            <ul style={{ textAlign:"left", margin:"12px 0", paddingLeft:20, color:"#7c6faa", fontSize:13, lineHeight:2 }}>
              <li>Tasks</li><li>Time Entries</li>
            </ul>
            <p style={{ fontSize:13, color:"#7c3aed", fontWeight:600 }}>✅ An invoice will be auto-generated before closing.</p>
            <p style={{ fontSize:12, color:"#ef4444" }}>This action cannot be undone.</p>
            <div className="pj-modal-actions">
              <button className="pj-modal-cancel" onClick={() => setCloseConfirm(null)}>Cancel</button>
              <button className="pj-modal-confirm" onClick={() => handleCloseProject(closeConfirm.id)}>Yes, Close Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}