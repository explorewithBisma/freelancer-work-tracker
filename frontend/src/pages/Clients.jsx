import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./clients.css";

const Icons = {
  users:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  mail:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  edit:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  key:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  search:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  close:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  warn:     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  lock:     <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  plus:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  eye:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
};

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [editClient, setEditClient]         = useState(null);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [portalClient, setPortalClient]     = useState(null);
  const [portalPassword, setPortalPassword] = useState("");
  const [portalMsg, setPortalMsg]           = useState("");
  const [portalLoading, setPortalLoading]   = useState(false);
  const [search, setSearch]                 = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const isMounted = useRef(true);

  const emptyForm = { name: "", email: "", phone: "", company: "" };
  const [formData, setFormData] = useState(emptyForm);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/clients");
      if (isMounted.current) setClients(res.data || []);
    } catch (err) { console.error(err); }
    finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => {
    isMounted.current = true;
    loadClients();
    return () => { isMounted.current = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const res = await api.post("/clients", formData);
      setClients(prev => [res.data, ...prev]);
      setFormData(emptyForm); setShowForm(false);
    } catch { alert("Failed to create client."); }
    finally { setSubmitting(false); }
  };

  const handleEditSave = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.put(`/clients/${editClient.id}`, formData);
      setClients(prev => prev.map(c => c.id === editClient.id ? { ...c, ...formData } : c));
      setEditClient(null); setFormData(emptyForm); setShowForm(false);
    } catch { alert("Failed to update client."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/clients/${id}`);
      setClients(prev => prev.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch { alert("Failed to delete client."); }
  };

  // ✅ FIX: client_id bhejte hain email ki jagah
  const handleSetPortalPassword = async (e) => {
    e.preventDefault();
    if (!portalClient?.id) return alert("Client not found.");
    setPortalLoading(true);
    try {
      await api.post("/client-portal/set-password", {
        client_id: portalClient.id,   // ✅ exact client — no clash
        password:  portalPassword,
      });
      setPortalMsg(`✅ Portal access set for ${portalClient.name}! Login details sent to ${portalClient.email}`);
      setPortalPassword("");
    } catch (err) {
      setPortalMsg(`Failed: ${err.response?.data?.detail || "Could not set password."}`);
    } finally { setPortalLoading(false); }
  };

  const openEdit = (e, client) => {
    e.stopPropagation();
    setEditClient(client);
    setFormData({ name: client.name||"", email: client.email||"", phone: client.phone||"", company: client.company||"" });
    setShowForm(true);
  };
  const openNew = () => { setEditClient(null); setFormData(emptyForm); setShowForm(true); };
  const openPortal = (e, client) => {
    e.stopPropagation();
    setPortalClient(client); setPortalPassword(""); setPortalMsg("");
  };
  const confirmDelete = (e, id) => {
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const getInitials = (name) => name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "?";
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "—";
  const COLORS = ["#e63946","#f4a261","#2a9d8f","#457b9d","#7b2d8b","#e76f51","#264653","#6a4c93","#1d7874","#c1121f"];
  const getColor = (name) => COLORS[(name?.charCodeAt(0)||0) % COLORS.length];

  const filtered = clients.filter(c =>
    [c.name, c.email, c.company, c.phone].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total:     clients.length,
    companies: clients.filter(c => c.company).length,
    withEmail: clients.filter(c => c.email).length,
  };

  if (loading) return (
    <div className="cl-loading"><div className="cl-spinner"/><p>Loading clients…</p></div>
  );

  return (
    <div className="cl-wrap">

      {/* Header */}
      <div className="cl-header">
        <div className="cl-header-left">
          <span className="cl-eyebrow">Client Management</span>
          <h1 className="cl-title">Clients</h1>
          <p className="cl-sub">Manage your client relationships in one place.</p>
        </div>
        <button className="cl-new-btn" onClick={openNew}>
          {Icons.plus} New Client
        </button>
      </div>

      {/* Stats */}
      <div className="cl-stats">
        {[
          { icon: Icons.users,    num: stats.total,     label: "Total Clients" },
          { icon: Icons.building, num: stats.companies, label: "Companies" },
          { icon: Icons.mail,     num: stats.withEmail, label: "With Email" },
          { icon: Icons.calendar, num: clients.length > 0 ? fmtDate(clients[clients.length-1]?.created_at).split(",")[0] : "—", label: "Latest Added" },
        ].map(s => (
          <div key={s.label} className="cl-stat">
            <div className="cl-stat-icon">{s.icon}</div>
            <div>
              <div className="cl-stat-num">{s.num}</div>
              <div className="cl-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className={`cl-form-wrap ${showForm ? "open" : ""}`}>
        <div className="cl-form-inner">
          <div className="cl-form-head">
            <h3>{editClient ? "Edit Client" : "New Client"}</h3>
            <button className="cl-form-close" onClick={() => { setShowForm(false); setEditClient(null); }}>{Icons.close}</button>
          </div>
          <form onSubmit={editClient ? handleEditSave : handleCreate}>
            <div className="cl-form-grid">
              <div className="cl-field">
                <label>Full Name *</label>
                <div className="cl-input-wrap">
                  <span className="cl-input-icon">{Icons.users}</span>
                  <input type="text" required placeholder="John Smith" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
                </div>
              </div>
              <div className="cl-field">
                <label>Email Address</label>
                <div className="cl-input-wrap">
                  <span className="cl-input-icon">{Icons.mail}</span>
                  <input type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/>
                </div>
              </div>
              <div className="cl-field">
                <label>Phone Number</label>
                <div className="cl-input-wrap">
                  <span className="cl-input-icon">{Icons.building}</span>
                  <input type="tel" placeholder="+1 234 567 8900" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/>
                </div>
              </div>
              <div className="cl-field">
                <label>Company</label>
                <div className="cl-input-wrap">
                  <span className="cl-input-icon">{Icons.building}</span>
                  <input type="text" placeholder="Acme Corp" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}/>
                </div>
              </div>
            </div>
            <button type="submit" className="cl-submit-btn" disabled={submitting}>
              {submitting ? "Saving…" : editClient ? "Save Changes" : "Add Client"}
            </button>
          </form>
        </div>
      </div>

      {/* Search */}
      <div className="cl-search-row">
        <div className="cl-search-wrap">
          <span className="cl-search-icon">{Icons.search}</span>
          <input className="cl-search-input" type="text" placeholder="Search by name, email, company…" value={search} onChange={e => setSearch(e.target.value)}/>
          {search && <button className="cl-search-clear" onClick={() => setSearch("")}>{Icons.close}</button>}
        </div>
        <div className="cl-results-count">{filtered.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}</div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="cl-empty">
          <div className="cl-empty-icon">{Icons.users}</div>
          <h3>{search ? `No results for "${search}"` : "No clients yet"}</h3>
          <p>{search ? "Try a different search term." : "Click \"New Client\" to add your first client."}</p>
        </div>
      ) : (
        <div className="cl-grid">
          {filtered.map((client, i) => (
            <div key={client.id} className="cl-card"
              style={{ animationDelay: `${i * 0.05}s`, cursor: "pointer" }}
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="cl-card-top">
                <div className="cl-avatar" style={{ background: getColor(client.name) }}>
                  {getInitials(client.name)}
                </div>
                <div className="cl-card-actions">
                  <button className="cl-act-btn portal" onClick={(e) => openPortal(e, client)} title="Set Portal Access">{Icons.key}</button>
                  <button className="cl-act-btn edit"   onClick={(e) => openEdit(e, client)}   title="Edit">{Icons.edit}</button>
                  <button className="cl-act-btn del"    onClick={(e) => confirmDelete(e, client.id)} title="Delete">{Icons.trash}</button>
                </div>
              </div>
              <div className="cl-card-name">{client.name}</div>
              {client.company && <div className="cl-card-company">{client.company}</div>}
              <div className="cl-card-contacts">
                {client.email && (
                  <a href={`mailto:${client.email}`} className="cl-contact-row" onClick={e => e.stopPropagation()}>
                    <span className="cl-contact-icon">{Icons.mail}</span>
                    <span className="cl-contact-text">{client.email}</span>
                  </a>
                )}
                {!client.email && !client.phone && <div className="cl-no-contact">No contact info</div>}
              </div>
              <div className="cl-card-footer">
                <span className="cl-card-date">Added {fmtDate(client.created_at)}</span>
                <span className="cl-view-detail">{Icons.eye} View Details</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Portal Password Modal */}
      {portalClient && (
        <div className="cl-modal-overlay" onClick={() => setPortalClient(null)}>
          <div className="cl-modal" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-icon">{Icons.lock}</div>
            <h3>Set Portal Access</h3>
            <p>Set a password for <strong>{portalClient.name}</strong> so they can login to the client portal.</p>
            {portalMsg ? (
              <div className={`cl-portal-msg ${portalMsg.startsWith("✅") ? "success" : "error"}`}>
                {portalMsg}
              </div>
            ) : (
              <form onSubmit={handleSetPortalPassword}>
                <input type="password" className="cl-portal-input"
                  placeholder="Set a password for client"
                  value={portalPassword} onChange={e => setPortalPassword(e.target.value)}
                  required minLength={6}/>
                <div className="cl-modal-btns" style={{marginTop: 14}}>
                  <button type="button" className="cl-modal-cancel" onClick={() => setPortalClient(null)}>Cancel</button>
                  <button type="submit" className="cl-modal-confirm" disabled={portalLoading}>
                    {portalLoading ? "Setting…" : "Set Password"}
                  </button>
                </div>
              </form>
            )}
            {portalMsg && (
              <button className="cl-modal-cancel" style={{width:"100%", marginTop:12}} onClick={() => setPortalClient(null)}>Close</button>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="cl-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="cl-modal" onClick={e => e.stopPropagation()}>
            <div className="cl-modal-icon">{Icons.warn}</div>
            <h3>Delete Client?</h3>
            <p>This will permanently remove the client and all associated data.</p>
            <div className="cl-modal-btns">
              <button className="cl-modal-cancel"  onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="cl-modal-confirm" onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}