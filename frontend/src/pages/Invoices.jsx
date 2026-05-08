import React, { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import "./invoices.css";

const Icons = {
  billing:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  earned:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  total:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  sent:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  draft:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  plus:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  folder:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  calendar: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  print:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  warn:     <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  empty:    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  arrow:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

// ONLY CHANGE: added `no-print` class to action buttons container + buttons

function InvoicePDF({ invoice, client, project, onClose }) {
  const handlePrint = () => window.print();
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" }) : "—";

  return (
    <div className="pdf-overlay" id="printable-pdf-modal" onClick={onClose}>
      <div className="pdf-modal" onClick={e => e.stopPropagation()}>

        {/* ✅ FIXED: added no-print here */}
        <div className="pdf-actions no-print">
          <button className="pdf-close-btn no-print" onClick={onClose}>
            Close
          </button>
          <button className="pdf-print-btn no-print" onClick={handlePrint}>
            Print / Save PDF
          </button>
        </div>

        <div className="pdf-doc">
          <div className="pdf-header">
            <div className="pdf-brand">
              <div className="pdf-brand-logo">FWT</div>
              <div>
                <div className="pdf-brand-name">Freelancer Work Tracker</div>
                <div className="pdf-brand-sub">Professional Invoice</div>
              </div>
            </div>
            <div className="pdf-inv-meta">
              <div className="pdf-inv-num">#{invoice.invoice_number}</div>
              <div className={`pdf-status-badge status-${invoice.status}`}>
                {invoice.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="pdf-divider" />

          <div className="pdf-info-row">
            <div className="pdf-bill-to">
              <div className="pdf-section-label">Bill To</div>
              <div className="pdf-client-name">{client?.name || `Client #${invoice.client_id}`}</div>
              {client?.email && <div className="pdf-client-email">{client.email}</div>}
              {client?.company && <div className="pdf-client-company">{client.company}</div>}
            </div>

            <div className="pdf-period">
              <div className="pdf-section-label">Service Period</div>
              <div className="pdf-period-dates">
                <div className="pdf-period-row"><span>From</span><strong>{formatDate(invoice.date_from)}</strong></div>
                <div className="pdf-period-row"><span>To</span><strong>{formatDate(invoice.date_to)}</strong></div>
              </div>

              <div className="pdf-section-label" style={{ marginTop: 16 }}>Invoice Date</div>
              <div className="pdf-created">{formatDate(invoice.created_at)}</div>
            </div>
          </div>

          <div className="pdf-table-wrap">
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Period</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="pdf-desc-main">Freelance Services</div>
                    {project && <div className="pdf-desc-sub">{project.title}</div>}
                  </td>
                  <td>{formatDate(invoice.date_from)} — {formatDate(invoice.date_to)}</td>
                  <td className="pdf-amount" style={{ textAlign: 'right' }}>
                    ${parseFloat(invoice.total_amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pdf-total-row">
            <div className="pdf-total-label">Total Due</div>
            <div className="pdf-total-amount">${parseFloat(invoice.total_amount).toFixed(2)}</div>
          </div>

          <div className="pdf-footer">
            <div className="pdf-footer-note">Thank you for your business!</div>
            <div className="pdf-footer-sub">Generated by Freelancer Work Tracker</div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pdfInvoice, setPdfInvoice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "", project_id: "", invoice_number: "",
    date_from: "", date_to: "", total_amount: "", status: "draft",
  });
  const isMounted = useRef(true);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [invRes, clientRes, projRes] = await Promise.all([
        api.get("/invoices"), api.get("/clients"), api.get("/projects/"),
      ]);
      if (isMounted.current) {
        setInvoices(invRes.data || []);
        setClients(clientRes.data || []);
        setProjects(projRes.data || []);
      }
    } catch (err) { console.error(err); }
    finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => {
    isMounted.current = true;
    loadAll();
    return () => { isMounted.current = false; };
  }, []);

  const generateNum = () => {
    const now = new Date();
    return `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000)+1000}`;
  };

  const openForm = () => {
    setFormData({ client_id:"", project_id:"", invoice_number: generateNum(), date_from:"", date_to:"", total_amount:"", status:"draft" });
    setShowForm(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/invoices", {
        ...formData,
        client_id: Number(formData.client_id),
        project_id: formData.project_id ? Number(formData.project_id) : null,
        total_amount: parseFloat(formData.total_amount) || 0,
      });
      setInvoices(prev => [res.data, ...prev]);
      setShowForm(false);
    } catch { alert("Failed to create invoice."); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/invoices/${id}`, { status: newStatus });
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
    } catch { alert("Failed to update status."); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/invoices/${id}`);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      setDeleteConfirm(null);
    } catch { alert("Failed to delete invoice."); }
  };

  const getClient = (id) => clients.find(c => String(c.id) === String(id));
  const getProject = (id) => projects.find(p => String(p.id) === String(id));
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month:"short", day:"2-digit", year:"numeric" }) : "—";
  const fmtAmount = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  const STATUS_NEXT = { draft:"sent", sent:"paid", paid:"draft" };
  const STATUS_LABEL = { draft:"Mark as Sent", sent:"Mark as Paid", paid:"Reset to Draft" };

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === "draft").length,
    sent: invoices.filter(i => i.status === "sent").length,
    paid: invoices.filter(i => i.status === "paid").length,
    revenue: invoices.filter(i => i.status === "paid").reduce((a, i) => a + parseFloat(i.total_amount || 0), 0),
  };

  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);

  if (loading) return <div className="inv-loading"><div className="inv-spinner"/><p>Loading invoices…</p></div>;

  return (
    <div className="inv-wrap">
      <div className="inv-bg-grid"/>

      <div className="inv-header no-print">
        <div>
          <span className="inv-eyebrow">{Icons.billing} Billing</span>
          <h1 className="inv-title">Invoices</h1>
          <p className="inv-sub">Generate, track, and manage your client invoices.</p>
        </div>
        <button className="inv-new-btn" onClick={openForm}>{Icons.plus} New Invoice</button>
      </div>

      <div className="inv-stats no-print">
        {[
          { c:"emerald", icon: Icons.earned, num: fmtAmount(stats.revenue), label: "Total Earned" },
          { c:"slate",   icon: Icons.total,  num: stats.total,              label: "All Invoices" },
          { c:"amber",   icon: Icons.sent,   num: stats.sent,               label: "Awaiting Payment" },
          { c:"rose",    icon: Icons.draft,  num: stats.draft,              label: "Drafts" },
        ].map(s => (
          <div key={s.label} className={`inv-stat ${s.c}`}>
            <div className="inv-stat-icon">{s.icon}</div>
            <div>
              <div className="inv-stat-num">{s.num}</div>
              <div className="inv-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={`inv-form-wrap no-print ${showForm ? "open" : ""}`}>
        <div className="inv-form-inner">
          <div className="inv-form-head">
            <h3>New Invoice</h3>
            <button className="inv-form-close" onClick={() => setShowForm(false)}>{Icons.close}</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="inv-form-grid">
              <div className="inv-field">
                <label>Invoice #</label>
                <input type="text" required value={formData.invoice_number}
                  onChange={e => setFormData({...formData, invoice_number: e.target.value})} placeholder="INV-1234"/>
              </div>
              <div className="inv-field">
                <label>Client</label>
                <select required value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="inv-field">
                <label>Project (optional)</label>
                <select value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                  <option value="">No project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div className="inv-field">
                <label>Total Amount ($)</label>
                <input type="number" min="0" step="0.01" required value={formData.total_amount}
                  onChange={e => setFormData({...formData, total_amount: e.target.value})} placeholder="0.00"/>
              </div>
              <div className="inv-field">
                <label>Date From</label>
                <input type="date" required value={formData.date_from} onChange={e => setFormData({...formData, date_from: e.target.value})}/>
              </div>
              <div className="inv-field">
                <label>Date To</label>
                <input type="date" required value={formData.date_to} onChange={e => setFormData({...formData, date_to: e.target.value})}/>
              </div>
              <div className="inv-field">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <button type="submit" className="inv-submit-btn" disabled={submitting}>
              {submitting ? "Creating…" : "Create Invoice"}
            </button>
          </form>
        </div>
      </div>

      <div className="inv-filters no-print">
        {["all","draft","sent","paid"].map(f => (
          <button key={f} className={`inv-filter-tab ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="inv-filter-count">
              {f === "all" ? invoices.length : invoices.filter(i => i.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="inv-grid no-print">
        {filtered.map((inv, i) => {
          const client = getClient(inv.client_id);
          const project = getProject(inv.project_id);
          return (
            <div key={inv.id} className={`inv-card status-card-${inv.status}`} style={{ animationDelay:`${i*0.06}s` }}>
              <div className="inv-card-top">
                <div className="inv-card-num">#{inv.invoice_number}</div>
                <span className={`inv-badge badge-${inv.status}`}>{inv.status}</span>
              </div>
              <div className="inv-card-client">
                <div className="inv-client-avatar">{(client?.name||"?").charAt(0).toUpperCase()}</div>
                <div>
                  <div className="inv-client-name">{client?.name || `Client #${inv.client_id}`}</div>
                  {project && <div className="inv-project-tag">{Icons.folder} {project.title}</div>}
                </div>
              </div>
              <div className="inv-card-amount">{fmtAmount(inv.total_amount)}</div>
              <div className="inv-card-dates">
                {Icons.calendar} {fmtDate(inv.date_from)} {Icons.arrow} {fmtDate(inv.date_to)}
              </div>
              <div className="inv-card-actions">
                <button className="inv-action-btn pdf-btn" onClick={() => setPdfInvoice(inv)}>{Icons.print} PDF</button>
                <button className={`inv-action-btn status-btn status-next-${inv.status}`}
                  onClick={() => handleStatusChange(inv.id, STATUS_NEXT[inv.status])}>{STATUS_LABEL[inv.status]}</button>
                <button className="inv-action-btn del-btn" onClick={() => setDeleteConfirm(inv.id)}>{Icons.trash}</button>
              </div>
            </div>
          );
        })}
      </div>

      {pdfInvoice && (
        <InvoicePDF
          invoice={pdfInvoice}
          client={getClient(pdfInvoice.client_id)}
          project={getProject(pdfInvoice.project_id)}
          onClose={() => setPdfInvoice(null)}
        />
      )}

      {deleteConfirm && (
        <div className="inv-del-overlay no-print" onClick={() => setDeleteConfirm(null)}>
          <div className="inv-del-modal" onClick={e => e.stopPropagation()}>
            <div className="inv-del-icon">{Icons.warn}</div>
            <h3>Delete Invoice?</h3>
            <p>This cannot be undone.</p>
            <div className="inv-del-btns">
              <button className="inv-del-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="inv-del-confirm" onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}