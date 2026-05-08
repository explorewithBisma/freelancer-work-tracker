import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "./layout.css";
import { useAuth } from "../auth/AuthContext";
import ChatWidget from "./ChatWidget";

const SideIcons = {
  dashboard: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  projects:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  tasks:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  time:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  invoices:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  clients:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  settings:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const navLinks = [
  { to: "/dashboard",    label: "Dashboard",    icon: SideIcons.dashboard },
  { to: "/clients",      label: "Clients",      icon: SideIcons.clients },
  { to: "/projects",     label: "Projects",     icon: SideIcons.projects },
  { to: "/tasks",        label: "Tasks",        icon: SideIcons.tasks },
  { to: "/time-entries", label: "Time Entries", icon: SideIcons.time },
  { to: "/invoices",     label: "Invoices",     icon: SideIcons.invoices },
  { to: "/settings",     label: "Settings",     icon: SideIcons.settings },
];

export default function Layout() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { isAuth, logout, user } = useAuth();

  const noSidebarPaths = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isLandingPage  = location.pathname === "/";
  const isClientPortal = location.pathname === "/client-portal" || location.pathname === "/client-login";
  const showSidebar    = isAuth && !noSidebarPaths.includes(location.pathname);
  const showTopbar     = !isClientPortal;

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const displayName  = user?.full_name || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="site">

      {/* TOPBAR */}
      {showTopbar && <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="brand">
            <svg width="38" height="38" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="11" fill="rgba(255,255,255,0.14)"/>
              <rect x="1" y="1" width="38" height="38" rx="10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none"/>
              <line x1="20" y1="10" x2="10" y2="30" stroke="rgba(255,255,255,0.50)" strokeWidth="1.5"/>
              <line x1="20" y1="10" x2="30" y2="30" stroke="rgba(255,255,255,0.50)" strokeWidth="1.5"/>
              <line x1="10" y1="30" x2="30" y2="30" stroke="rgba(255,255,255,0.50)" strokeWidth="1.5"/>
              <circle cx="20" cy="23" r="2" fill="rgba(255,255,255,0.35)"/>
              <circle cx="20" cy="10" r="3.5" fill="white"/>
              <circle cx="10" cy="30" r="3.5" fill="white"/>
              <circle cx="30" cy="30" r="3.5" fill="white"/>
            </svg>
            <span className="brand-text">FWT</span>
          </Link>
          <div className="nav-spacer" />
          <div className="nav-cta">
            {isLandingPage && (
              isAuth ? (
                <Link to="/dashboard" className="nav-btn-solid">Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/login"    className="nav-btn-ghost">Login</Link>
                  <Link to="/register" className="nav-btn-solid">Get Started</Link>
                </>
              )
            )}
          </div>
        </div>
      </header>}

      <div className="app-container">

        {/* SIDEBAR */}
        {showSidebar && (
          <aside className="sidebar-vertical">
            <nav className="sidebar-menu">
              {navLinks.map(link => (
                <Link key={link.to} to={link.to}
                  className={`sidebar-link ${location.pathname === link.to ? "active" : ""}`}>
                  <span className="sidebar-icon">{link.icon}</span>
                  <span className="sidebar-label">{link.label}</span>
                </Link>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-user-card">
                <div className="sidebar-avatar">{avatarLetter}</div>
                <div className="sidebar-user-info">
                  <p className="sidebar-user-name">{displayName}</p>
                  <p className="sidebar-user-role">Freelancer</p>
                </div>
                <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign out">
                  {SideIcons.logout}
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main className={`page ${!showSidebar ? "full-width" : ""}`}>
          <Outlet />
        </main>

      </div>

      {/* ✅ CHAT WIDGET — sirf logged in pages pe */}
      {showSidebar && <ChatWidget />}

    </div>
  );
}