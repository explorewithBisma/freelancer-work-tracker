import React, { useEffect, useState } from "react";
import api from "../api/axios";
import "./timeEntries.css";

const Icons = {
  clock:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  edit:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  warn:   <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  empty:  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  plus:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  folder: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
};

export default function TimeEntries() {
  const [entries, setEntries]     = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editNote, setEditNote]   = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData]   = useState({
    task_id: "", date: new Date().toISOString().split("T")[0],
    hours: "", minutes: "", note: ""
  });

  const fetchAll = async () => {
    try {
      const [entriesRes, tasksRes] = await Promise.all([
        api.get("/time-entries/"),
        api.get("/tasks/"),
      ]);
      setEntries(Array.isArray(entriesRes.data) ? entriesRes.data : []);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getTaskTitle = (taskId) => {
    const task = tasks.find(t => String(t.id) === String(taskId));
    return task ? task.title : `Task #${taskId}`;
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/time-entries/${id}/`);
      setEntries(prev => prev.filter(e => e.id !== id));
      setDeleteConfirm(null);
    } catch { alert("Failed to delete entry."); }
  };

  const handleEditSave = async (id) => {
    try {
      await api.patch(`/time-entries/${id}/`, { note: editNote });
      setEntries(prev => prev.map(e => e.id === id ? { ...e, note: editNote } : e));
      setEditingId(null);
    } catch { alert("Failed to update note."); }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!formData.task_id) return alert("Please select a task.");
    const hours   = parseInt(formData.hours   || 0);
    const minutes = parseInt(formData.minutes || 0);
    const totalSeconds = (hours * 3600) + (minutes * 60);
    if (totalSeconds <= 0) return alert("Please enter a valid duration.");
    setSubmitting(true);
    try {
      await api.post("/time-entries/", {
        task_id:          Number(formData.task_id),
        duration_seconds: totalSeconds,
        date:             formData.date,
        note:             formData.note || "Manual entry",
      });
      setFormData({ task_id: "", date: new Date().toISOString().split("T")[0], hours: "", minutes: "", note: "" });
      setShowForm(false);
      fetchAll();
    } catch { alert("Failed to add entry."); }
    finally { setSubmitting(false); }
  };

  const formatDuration = (seconds) => {
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { hrs, mins, secs, str: `${hrs}h ${mins}m ${secs}s` };
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      day:   d.toLocaleDateString("en-US", { day: "2-digit" }),
      month: d.toLocaleDateString("en-US", { month: "short" }),
      year:  d.getFullYear(),
    };
  };

  const totalSeconds = entries.reduce((acc, e) => acc + (e.duration_seconds || 0), 0);
  const totalFmt     = formatDuration(totalSeconds);

  if (loading) return (
    <div className="te-loading">
      <div className="te-loading-inner">
        <div className="te-pulse"/>
        <p>Loading time ledger…</p>
      </div>
    </div>
  );

  return (
    <div className="te-wrap">
      <div className="te-blob te-blob-1"/>
      <div className="te-blob te-blob-2"/>

      {/* Header */}
      <div className="te-header">
        <div className="te-header-left">
          <span className="te-eyebrow">{Icons.clock} Time Tracking</span>
          <h1 className="te-title">Time Ledger</h1>
          <p className="te-sub">All your billable hours, beautifully organized.</p>
        </div>
        <div className="te-header-right">
          <button className="te-add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? <>{Icons.close} Cancel</> : <>{Icons.plus} Add Entry</>}
          </button>
          <div className="te-total-card">
            <div className="te-total-label">Total Tracked</div>
            <div className="te-total-time">
              <span className="te-total-num">{totalFmt.hrs}</span>
              <span className="te-total-unit">h</span>
              <span className="te-total-num">{totalFmt.mins}</span>
              <span className="te-total-unit">m</span>
              <span className="te-total-num">{totalFmt.secs}</span>
              <span className="te-total-unit">s</span>
            </div>
            <div className="te-total-entries">{entries.length} session{entries.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      <div className={`te-form-wrap ${showForm ? "open" : ""}`}>
        <div className="te-form-inner">
          <h3 className="te-form-title">Add Manual Entry</h3>
          <form onSubmit={handleManualAdd} className="te-form-grid">
            <div className="te-form-field">
              <label>Task</label>
              <div className="te-field">
                <span>{Icons.folder}</span>
                <select required value={formData.task_id} onChange={e => setFormData({...formData, task_id: e.target.value})}>
                  <option value="">Select task...</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
            </div>
            <div className="te-form-field">
              <label>Date</label>
              <div className="te-field">
                <span>{Icons.clock}</span>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required/>
              </div>
            </div>
            <div className="te-form-field">
              <label>Hours</label>
              <div className="te-field">
                <input type="number" min="0" max="24" placeholder="0" value={formData.hours} onChange={e => setFormData({...formData, hours: e.target.value})}/>
              </div>
            </div>
            <div className="te-form-field">
              <label>Minutes</label>
              <div className="te-field">
                <input type="number" min="0" max="59" placeholder="0" value={formData.minutes} onChange={e => setFormData({...formData, minutes: e.target.value})}/>
              </div>
            </div>
            <div className="te-form-field te-form-wide">
              <label>Note (optional)</label>
              <div className="te-field">
                <input type="text" placeholder="What did you work on?" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}/>
              </div>
            </div>
            <button type="submit" className="te-form-submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="te-table-wrap">
        {entries.length === 0 ? (
          <div className="te-empty">
            <div className="te-empty-icon">{Icons.empty}</div>
            <h3>No time entries yet</h3>
            <p>Start a stopwatch on any in-progress task, or add a manual entry above.</p>
          </div>
        ) : (
          <table className="te-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Duration</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const d   = formatDate(entry.date);
                const dur = formatDuration(entry.duration_seconds || 0);
                return (
                  <tr key={entry.id} style={{ animationDelay: `${i * 0.06}s` }}>
                    <td>
                      <div className="te-date-cell">
                        <div className="te-date-badge">
                          <span className="te-date-day">{d.day}</span>
                          <span className="te-date-month">{d.month}</span>
                        </div>
                        <span className="te-date-year">{d.year}</span>
                      </div>
                    </td>
                    <td>
                      <span className="te-task-badge">
                        {getTaskTitle(entry.task_id)}
                      </span>
                    </td>
                    <td>
                      <div className="te-dur-cell">
                        <span className="te-dur-dot"/>
                        <span className="te-dur-text">{dur.str}</span>
                      </div>
                    </td>
                    <td>
                      {editingId === entry.id ? (
                        <div className="te-note-edit">
                          <input className="te-note-input" value={editNote}
                            onChange={e => setEditNote(e.target.value)} autoFocus
                            onKeyDown={e => { if (e.key === "Enter") handleEditSave(entry.id); if (e.key === "Escape") setEditingId(null); }}/>
                          <button className="te-save-btn" onClick={() => handleEditSave(entry.id)}>Save</button>
                          <button className="te-cancel-btn" onClick={() => setEditingId(null)}>{Icons.close}</button>
                        </div>
                      ) : (
                        <span className="te-note-text">{entry.note || "—"}</span>
                      )}
                    </td>
                    <td>
                      <div className="te-actions">
                        <button className="te-action-btn edit" title="Edit note"
                          onClick={() => { setEditingId(entry.id); setEditNote(entry.note || ""); }}>
                          {Icons.edit}
                        </button>
                        <button className="te-action-btn del" title="Delete"
                          onClick={() => setDeleteConfirm(entry.id)}>
                          {Icons.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="te-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="te-modal" onClick={e => e.stopPropagation()}>
            <div className="te-modal-icon">{Icons.warn}</div>
            <h3>Delete Entry?</h3>
            <p>This time log will be permanently removed.</p>
            <div className="te-modal-btns">
              <button className="te-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="te-modal-confirm" onClick={() => handleDelete(deleteConfirm)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}