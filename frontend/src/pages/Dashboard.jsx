import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./dashboard.css";

// ── Clean SVG Icons ──
const Icons = {
  folder:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  check:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  invoice:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  bell:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  arrow:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  plus:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  timer:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  warning:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  chart:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  tasks:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  lock:     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  rocket:   <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  wave:     null,
  logout:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function Dashboard() {
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile]       = useState(false);
  const [showNotifs, setShowNotifs]         = useState(false);
  const [activityPeriod, setActivityPeriod] = useState("Month");
  const [isFirstVisit, setIsFirstVisit]     = useState(false);
  const [animateCards, setAnimateCards]     = useState(false);
  const [data, setData]                     = useState(null);
  const [loading, setLoading]               = useState(true);

  const displayName  = user?.full_name || "User";
  const displayEmail = user?.email     || "";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  // ── Default data so cards always show ──
  const d = data ?? {
    total_projects: 0, total_tasks: 0, total_clients: 0, total_invoices: 0,
    hours_this_week: 0, pending_invoices_amount: 0, pending_invoices_count: 0,
    completed_tasks: 0, productivity_pct: 0, weekly_hours_target: 35,
    weekly_goal_pct: 0, recent_tasks: [], todo_tasks_count: 0, activity_data: []
  };

  useEffect(() => {
    if (!token) return;
    // Try with Authorization header first, axios interceptor will also add it
    api.get("/dashboard/summary")
      .then(res => { setData(res.data); setTimeout(() => setAnimateCards(true), 100); })
      .catch(err => {
        console.error("Dashboard API error:", err?.response?.status, err?.response?.data);
        setTimeout(() => setAnimateCards(true), 100);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!user) return;
    const key = `fwt_visited_${user.id}`;
    if (!localStorage.getItem(key)) { setIsFirstVisit(true); localStorage.setItem(key, "true"); }
  }, [user]);

  const handleLogout = () => { logout(); navigate("/login"); };

  // Chart
  const buildChart = () => {
    if (!d.activity_data?.length) return { linePath: "", fillPath: "", labels: [], coords: [] };
    const pts  = d.activity_data;
    const maxH = Math.max(...pts.map(p => p.hours), 1);
    const W = 450, H = 90, padX = 10, padY = 12;
    const coords = pts.map((p, i) => [
      (i / (pts.length - 1)) * (W - padX * 2) + padX,
      H - padY - ((p.hours / maxH) * (H - padY * 2))
    ]);
    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(" ");
    const fillPath = `${linePath} L ${coords[coords.length-1][0].toFixed(1)} ${H} L ${coords[0][0].toFixed(1)} ${H} Z`;
    return { linePath, fillPath, labels: pts.map(p => p.month), coords };
  };
  const chart = buildChart();

  const productivity = d.productivity_pct;
  const weeklyGoal   = d.weekly_goal_pct;
  const donutOffset  = 238.76 * (1 - productivity / 100);
  const ringOffset   = 188.5  * (1 - weeklyGoal  / 100);

  const summaryCards = [
    { icon: Icons.folder,  label: "Total Projects",   value: String(d.total_projects).padStart(2,"0"),          sub: `${d.total_clients} client${d.total_clients !== 1 ? "s" : ""}`, color: "purple", path: "/projects" },
    { icon: Icons.check,   label: "Total Tasks",      value: String(d.total_tasks),                             sub: `${d.todo_tasks_count} pending`,                                 color: "",       path: "/tasks" },
    { icon: Icons.clock,   label: "Hours This Week",  value: `${d.hours_this_week}h`,                           sub: `${d.weekly_goal_pct}% of weekly goal`,                          color: "",       path: "/time-entries" },
    { icon: Icons.invoice, label: "Pending Invoices", value: `$${d.pending_invoices_amount.toLocaleString()}`,  sub: `${d.pending_invoices_count} unpaid`,                            color: "",       path: "/invoices" },
  ];

  const quickActions = [
    { label: "New Project",    icon: Icons.folder,  path: "/projects" },
    { label: "Add Task",       icon: Icons.check,   path: "/tasks" },
    { label: "Start Timer",    icon: Icons.timer,   path: "/time-entries" },
    { label: "Create Invoice", icon: Icons.invoice, path: "/invoices" },
  ];

  const statusLabel = (s) => s === "in_progress" ? "In Progress" : s === "done" ? "Done" : "To Do";
  const statusClass = (s) => s === "in_progress" ? "inprogress" : s === "done" ? "done" : "pending";

  return (
    <div className="db-wrap">

      {/* ══ TOPBAR ══ */}
      <header className="db-topbar">
        <div className="db-topbar-left">
          <div className="db-greeting-block">
            <span className="db-greeting-text">{getGreeting()},</span>
            <span className="db-greeting-name">{displayName}</span>
          </div>
        </div>
        <div className="db-topbar-right">
          <div className="db-notif-wrap">
            <button className="db-notif-btn" title="Notifications" onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}>
              {Icons.bell}
              {data && data.todo_tasks_count > 0 && <span className="db-notif-dot"/>}
            </button>

            {showNotifs && (
              <div className="db-notif-dropdown">
                <div className="db-notif-header">
                  <h4>Notifications</h4>
                  <span className="db-notif-count">{data ? data.todo_tasks_count + (data.pending_invoices_count > 0 ? 1 : 0) : 0} new</span>
                </div>
                <div className="db-notif-list">
                  {data && data.todo_tasks_count > 0 && (
                    <div className="db-notif-item warning" onClick={() => { navigate("/tasks"); setShowNotifs(false); }}>
                      <div className="db-notif-item-icon">
                        {Icons.check}
                      </div>
                      <div className="db-notif-item-text">
                        <p className="db-notif-item-title">{data.todo_tasks_count} pending task{data.todo_tasks_count > 1 ? "s" : ""}</p>
                        <p className="db-notif-item-sub">Complete them to hit your weekly goal</p>
                      </div>
                    </div>
                  )}
                  {data && data.pending_invoices_count > 0 && (
                    <div className="db-notif-item info" onClick={() => { navigate("/invoices"); setShowNotifs(false); }}>
                      <div className="db-notif-item-icon">
                        {Icons.invoice}
                      </div>
                      <div className="db-notif-item-text">
                        <p className="db-notif-item-title">${data.pending_invoices_amount.toLocaleString()} unpaid</p>
                        <p className="db-notif-item-sub">{data.pending_invoices_count} invoice{data.pending_invoices_count > 1 ? "s" : ""} awaiting payment</p>
                      </div>
                    </div>
                  )}
                  {data && data.todo_tasks_count === 0 && data.pending_invoices_count === 0 && (
                    <div className="db-notif-empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                      <p>You're all caught up!</p>
                    </div>
                  )}
                  {!data && (
                    <div className="db-notif-empty"><p>Loading...</p></div>
                  )}
                </div>
                <button className="db-notif-footer" onClick={() => setShowNotifs(false)}>
                  Dismiss all
                </button>
              </div>
            )}
          </div>
          <div className="db-user-pill" onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}>
            <div className="db-user-avatar">{avatarLetter}</div>
            <div className="db-user-info">
              <span className="db-user-name">{displayName}</span>
              <span className="db-user-role">Freelancer</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points={showProfile ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>

            {showProfile && (
              <div className="db-profile-dropdown">
                <div className="db-drop-header">
                  <div className="db-drop-avatar">{avatarLetter}</div>
                  <div>
                    <p className="db-drop-name">{displayName}</p>
                    <p className="db-drop-email">{displayEmail}</p>
                  </div>
                </div>
                <div className="db-drop-divider"/>
                <div className="db-drop-status">
                  <span className="db-status-dot online"/>
                  <span>Session active</span>
                </div>
                <button className="db-logout-btn" onClick={handleLogout}>
                  {Icons.logout}&nbsp; Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="db-body">
        <div className="db-center-col">

          {/* Priority Alert */}
          {d.todo_tasks_count > 0 && (
            <div className="db-priority-alert">
              <span className="db-priority-icon">{Icons.warning}</span>
              <div>
                <p className="db-priority-title">
                  <strong>{d.todo_tasks_count} task{d.todo_tasks_count > 1 ? "s" : ""}</strong> require your attention
                </p>
                <p className="db-priority-sub">Complete pending tasks to reach your weekly goal.</p>
              </div>
              <button className="db-priority-btn" onClick={() => navigate("/tasks")}>
                View Tasks {Icons.arrow}
              </button>
            </div>
          )}

          {/* Welcome Banner */}
          <div className="db-banner">
            <div className="db-banner-text">
              <p className="db-banner-kicker">
                {isFirstVisit ? "Welcome aboard" : "Dashboard overview"}
              </p>
              <h2 className="db-banner-title">
                {isFirstVisit ? `Let's get you started, ${displayName}` : "Ready to track your work?"}
              </h2>
              <p className="db-banner-sub">
                {isFirstVisit
                  ? "Manage projects, track time, and generate invoices — all in one place."
                  : `${d.todo_tasks_count} pending task${d.todo_tasks_count !== 1 ? "s" : ""} · $${d.pending_invoices_amount.toLocaleString()} in unpaid invoices`}
              </p>
              {!isFirstVisit && (
                <button className="db-banner-cta" onClick={() => navigate("/tasks")}>
                  View Tasks
                </button>
              )}
            </div>
            <div className="db-banner-art">
              <div className="db-banner-blob">{Icons.rocket}</div>
            </div>
          </div>

          {/* Summary Cards — always show */}
          <div className="db-cards-row">
            {summaryCards.map((card, i) => (
              <div
                key={card.label}
                className={`db-sum-card ${card.color} ${animateCards ? "animate" : ""}`}
                style={{ animationDelay: `${i * 0.07}s` }}
                onClick={() => card.path && navigate(card.path)}
              >
                <div className="sum-top-row">
                  <div className="sum-card-icon">{card.icon}</div>
                  <span className="sum-arrow">{Icons.arrow}</span>
                </div>
                <p className="sum-card-label">{card.label}</p>
                <p className="sum-card-num">{loading ? "—" : card.value}</p>
                <p className="sum-card-sub">{loading ? "Loading..." : card.sub}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions + Activity */}
          <div className="db-mid-row">
            <div className="db-panel">
              <div className="db-panel-head">
                <h3>Quick Actions</h3>
              </div>
              <div className="db-quick-grid">
                {quickActions.map(a => (
                  <button key={a.label} className="db-quick-btn" onClick={() => navigate(a.path)}>
                    <span className="quick-icon">{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="db-panel">
              <div className="db-panel-head">
                <h3>Activity</h3>
                <div className="db-period-tabs">
                  {["Day","Week","Month","Year"].map(t => (
                    <button key={t}
                      className={`db-period-btn ${activityPeriod===t?"active":""}`}
                      onClick={() => setActivityPeriod(t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="db-chart-area">
                <svg viewBox="0 0 450 90" className="db-chart-svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18"/>
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed"/>
                      <stop offset="100%" stopColor="#ec4899"/>
                    </linearGradient>
                  </defs>
                  {chart.fillPath && <path d={chart.fillPath} fill="url(#chartFill)"/>}
                  {chart.linePath && <path d={chart.linePath} fill="none" stroke="url(#chartLine)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
                  {chart.coords?.length > 0 && (() => {
                    const last = chart.coords[chart.coords.length - 1];
                    return <>
                      <circle cx={last[0]} cy={last[1]} r="4" fill="#ec4899"/>
                      <circle cx={last[0]} cy={last[1]} r="8" fill="#ec4899" fillOpacity="0.15"/>
                    </>;
                  })()}
                </svg>
                <div className="db-chart-labels">
                  {(chart.labels || []).map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="db-panel">
            <div className="db-panel-head">
              <h3>Recent Tasks</h3>
              <Link to="/tasks" className="db-view-all">View all</Link>
            </div>
            {d.recent_tasks?.length > 0 ? (
              <table className="db-table">
                <thead>
                  <tr><th>Task</th><th>Project</th><th>Status</th><th>Hours</th></tr>
                </thead>
                <tbody>
                  {d.recent_tasks.map((task, i) => (
                    <tr key={i}>
                      <td><span className="db-task-name">{task.title}</span></td>
                      <td><span className="db-project-pill">{task.project_title}</span></td>
                      <td><span className={`db-badge ${statusClass(task.status)}`}>{statusLabel(task.status)}</span></td>
                      <td><strong>{task.hours}h</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="db-empty-state">
                <div className="db-empty-icon">{Icons.tasks}</div>
                <p>No tasks yet</p>
                <Link to="/tasks" className="db-empty-link">Create your first task</Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <aside className="db-right-col">

          {/* Productivity */}
          <div className="db-right-card grad-card">
            <div className="db-right-card-head">
              <h4>Productivity</h4>
              <span className="db-right-badge">This Week</span>
            </div>
            <div className="db-donut-wrap">
              <svg viewBox="0 0 100 100" className="db-donut-svg">
                <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10"/>
                <circle cx="50" cy="50" r="38" fill="none" stroke="white" strokeWidth="10"
                  strokeDasharray="238.76" strokeDashoffset={donutOffset}
                  strokeLinecap="round" transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}/>
              </svg>
              <div className="db-donut-inner">
                <span className="db-donut-pct">{productivity}%</span>
                <span className="db-donut-sub">Done</span>
              </div>
            </div>
            <p className="db-right-desc">Tasks completed this week</p>
            <div className="db-legend">
              <span><i className="leg white"/> Completed {productivity}%</span>
              <span><i className="leg pink"/> Remaining {100 - productivity}%</span>
            </div>
          </div>

          {/* Weekly Goal */}
          <div className="db-right-card grad-card">
            <div className="db-right-card-head">
              <div>
                <h4>Weekly Goal</h4>
                <p className="db-right-desc" style={{textAlign:"left",marginTop:3,opacity:0.7}}>Hour target</p>
              </div>
              <div className="db-mini-ring-wrap">
                <svg viewBox="0 0 80 80" className="db-mini-ring">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="9"/>
                  <circle cx="40" cy="40" r="30" fill="none" stroke="white" strokeWidth="9"
                    strokeDasharray="188.5" strokeDashoffset={ringOffset}
                    strokeLinecap="round" transform="rotate(-90 40 40)"
                    style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}/>
                </svg>
                <span className="db-mini-pct">{weeklyGoal}%</span>
              </div>
            </div>
            <div className="db-goal-bar-wrap">
              <div className="db-goal-bar">
                <div className="db-goal-bar-fill" style={{width:`${weeklyGoal}%`}}/>
              </div>
              <p className="db-right-note">{d.hours_this_week}h of {d.weekly_hours_target}h reached</p>
            </div>
          </div>

          {/* Session */}
          <div className="db-right-card dark-card">
            <div className="db-token-glow"/>
            <div className="db-token-icon">{Icons.lock}</div>
            <h4 className="db-token-title">Session Status</h4>
            <p className="db-token-sub">Your connection is encrypted and secure</p>
            <span className="db-token-pill active">Active Session</span>
            <button className="db-logout-pill" onClick={handleLogout}>
              {Icons.logout}&nbsp; Sign out
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}