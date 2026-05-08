import React, { useEffect, useState, useRef } from "react";
import { getTasks, deleteTask, createTask, updateTaskStatus as updateTask } from "../api/taskApi";
import { getProjects } from "../api/projectApi";
import Stopwatch from "./Stopwatch";
import "./tasks.css";

const Icons = {
  total:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  todo:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  progress: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 13 9 20 9"/><path d="M21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>,
  done:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  plus:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  close:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>,
  task:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><polyline points="9 11 12 14 22 4"/></svg>,
  folder:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  status:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  priority: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  warn:     <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  arrowL:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  arrowR:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "#ef4444", bg: "#fff0f0", dot: "#ef4444" },
  medium: { label: "Medium", color: "#f97316", bg: "#fff7ed", dot: "#f97316" },
  low:    { label: "Low",    color: "#22c55e", bg: "#f0fdf4", dot: "#22c55e" },
};

const EMPTY_FORM = { title: "", description: "", project_id: "", status: "todo", priority: "medium" };

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className="tk-priority-badge" style={{ background: cfg.bg, color: cfg.color }}>
      <span className="tk-priority-dot" style={{ background: cfg.dot }}/>
      {cfg.label}
    </span>
  );
}

function Column({ title, status, icon, color, tasks, projects, onDelete, onStatusChange, onEdit, onRefresh }) {
  const colTasks = tasks.filter(t => t.status === status);
  return (
    <div className={`tk-col ${color}`}>
      <div className="tk-col-head">
        <div className="tk-col-title-row">
          <span className="tk-col-icon">{icon}</span>
          <h3 className="tk-col-title">{title}</h3>
        </div>
        <span className="tk-col-count">{colTasks.length}</span>
      </div>
      <div className="tk-cards">
        {colTasks.length === 0 && (
          <div className="tk-empty-col"><span>No tasks here</span></div>
        )}
        {colTasks.map((task, i) => {
          const project = projects.find(p => String(p.id) === String(task.project_id));
          return (
            <div key={task.id} className="tk-card" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="tk-card-top">
                <span className="tk-project-tag">{project?.title || "No Project"}</span>
                <div className="tk-card-actions">
                  <button className="tk-action-btn edit" onClick={() => onEdit(task)}>{Icons.edit}</button>
                  <button className="tk-action-btn del"  onClick={() => onDelete(task.id)}>{Icons.trash}</button>
                </div>
              </div>

              {/* Priority badge */}
              <div className="tk-card-meta">
                <PriorityBadge priority={task.priority || "medium"} />
              </div>

              <h4 className="tk-card-title">{task.title}</h4>
              {task.description && <p className="tk-card-desc">{task.description}</p>}

              {status === "in_progress" && (
                <div className="tk-stopwatch-wrap">
                  <Stopwatch taskId={task.id} onSaveSuccess={onRefresh} />
                </div>
              )}

              <div className="tk-move-row">
                {status !== "todo" && (
                  <button className="tk-move-btn back" onClick={() => onStatusChange(task.id, status === "done" ? "in_progress" : "todo")}>
                    {Icons.arrowL} Back
                  </button>
                )}
                {status !== "done" && (
                  <button className="tk-move-btn forward" onClick={() => onStatusChange(task.id, status === "todo" ? "in_progress" : "done")}>
                    {status === "todo" ? "Start" : "Complete"} {Icons.arrowR}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const isMounted = useRef(true);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const loadData = async () => {
    try {
      if (isMounted.current) setLoading(true);
      const [taskRes, projectRes] = await Promise.all([getTasks(), getProjects()]);
      if (isMounted.current) {
        setTasks(taskRes.data || taskRes || []);
        setProjects(projectRes.data || projectRes || []);
      }
    } catch (err) { console.error(err); }
    finally { if (isMounted.current) setLoading(false); }
  };

  useEffect(() => {
    isMounted.current = true;
    loadData();
    return () => { isMounted.current = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.project_id) return alert("Please link this task to a project.");
    try {
      const res = await createTask({ ...formData, project_id: Number(formData.project_id) });
      setTasks(prev => [...prev, res.data || res]);
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch { alert("Failed to create task."); }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await updateTask(taskId, { ...task, status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch { alert("Failed to move task."); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      setDeleteConfirm(null);
    } catch { alert("Delete failed."); }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      project_id: task.project_id,
      status: task.status,
      priority: task.priority || "medium",
    });
    setShowForm(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await updateTask(editTask.id, { ...editTask, ...formData, project_id: Number(formData.project_id) });
      setTasks(prev => prev.map(t => t.id === editTask.id ? { ...t, ...formData } : t));
      setEditTask(null);
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch { alert("Failed to update task."); }
  };

  const stats = [
    { label: "Total",       value: tasks.length,                                    icon: Icons.total,    c: "purple" },
    { label: "To Do",       value: tasks.filter(t=>t.status==="todo").length,        icon: Icons.todo,     c: "gray"   },
    { label: "In Progress", value: tasks.filter(t=>t.status==="in_progress").length, icon: Icons.progress, c: "orange" },
    { label: "Completed",   value: tasks.filter(t=>t.status==="done").length,        icon: Icons.done,     c: "green"  },
  ];

  if (loading) return <div className="tk-loading"><div className="tk-spinner"/><p>Loading tasks...</p></div>;

  return (
    <div className="tk-wrap">

      {/* Header */}
      <div className="tk-header">
        <div className="tk-header-left">
          <p className="tk-eyebrow">Task Management</p>
          <h1 className="tk-title">Work Streams</h1>
          <p className="tk-sub">Track, move and complete your tasks across projects.</p>
        </div>
        <button className="tk-new-btn" onClick={() => { setShowForm(!showForm); setEditTask(null); setFormData(EMPTY_FORM); }}>
          {showForm ? <>{Icons.close} Cancel</> : <>{Icons.plus} New Task</>}
        </button>
      </div>

      {/* Stats */}
      <div className="tk-stats">
        {stats.map(s => (
          <div key={s.label} className={`tk-stat ${s.c}`}>
            <span className="tk-stat-icon">{s.icon}</span>
            <div>
              <p className="tk-stat-num">{s.value}</p>
              <p className="tk-stat-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className={`tk-form-wrap ${showForm ? "open" : ""}`}>
        <div className="tk-form-inner">
          <h3 className="tk-form-title">{editTask ? "Edit Task" : "New Task"}</h3>
          <form onSubmit={editTask ? handleEditSave : handleCreate}>
            <div className="tk-form-grid">
              <div className="tk-field-wrap">
                <label className="tk-label">Task Title</label>
                <div className="tk-field">
                  <span className="tk-field-icon">{Icons.task}</span>
                  <input type="text" placeholder="What are you working on?" required
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/>
                </div>
              </div>
              <div className="tk-field-wrap">
                <label className="tk-label">Link to Project</label>
                <div className="tk-field">
                  <span className="tk-field-icon">{Icons.folder}</span>
                  <select required value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="tk-field-wrap">
                <label className="tk-label">Priority</label>
                <div className="tk-field">
                  <span className="tk-field-icon">{Icons.priority}</span>
                  <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="tk-field-wrap">
                <label className="tk-label">Status</label>
                <div className="tk-field">
                  <span className="tk-field-icon">{Icons.status}</span>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="tk-field-wrap" style={{marginTop:12}}>
              <label className="tk-label">Description (optional)</label>
              <textarea className="tk-textarea" placeholder="Add details..."
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
            </div>
            <button type="submit" className="tk-submit-btn">
              {editTask ? "Save Changes" : "Add Task"}
            </button>
          </form>
        </div>
      </div>

      {/* Board */}
      <div className="tk-board">
        <Column title="To Do"       status="todo"        icon={Icons.todo}     color="col-gray"
          tasks={tasks} projects={projects} onDelete={id => setDeleteConfirm(id)}
          onStatusChange={handleUpdateStatus} onEdit={openEdit} onRefresh={loadData}/>
        <Column title="In Progress" status="in_progress" icon={Icons.progress} color="col-orange"
          tasks={tasks} projects={projects} onDelete={id => setDeleteConfirm(id)}
          onStatusChange={handleUpdateStatus} onEdit={openEdit} onRefresh={loadData}/>
        <Column title="Completed"   status="done"        icon={Icons.done}     color="col-green"
          tasks={tasks} projects={projects} onDelete={id => setDeleteConfirm(id)}
          onStatusChange={handleUpdateStatus} onEdit={openEdit} onRefresh={loadData}/>
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="tk-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="tk-modal" onClick={e => e.stopPropagation()}>
            <div className="tk-modal-icon">{Icons.warn}</div>
            <h3>Delete Task?</h3>
            <p>This action cannot be undone.</p>
            <div className="tk-modal-actions">
              <button className="tk-modal-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="tk-modal-confirm" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}