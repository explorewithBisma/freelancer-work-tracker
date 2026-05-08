import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout";
import Landing from "./pages/landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TempRoute from "./auth/TempRoute";
import ForgotPassword from "./pages/ForgotPassword";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import TimeEntries from "./pages/TimeEntries";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import ClientLogin  from "./pages/clientlogin";
import ClientPortal from "./pages/clientportal";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>

        {/* Public Routes */}
        <Route path="/"                element={<Landing />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Client Portal */}
        <Route path="/client-login"  element={<ClientLogin />} />
        <Route path="/client-portal" element={<ClientPortal />} />

        {/* Protected Routes */}
        <Route path="/dashboard"      element={<TempRoute><Dashboard /></TempRoute>} />
        <Route path="/projects"       element={<TempRoute><Projects /></TempRoute>} />
        <Route path="/tasks"          element={<TempRoute><Tasks /></TempRoute>} />
        <Route path="/time-entries"   element={<TempRoute><TimeEntries /></TempRoute>} />
        <Route path="/invoices"       element={<TempRoute><Invoices /></TempRoute>} />
        <Route path="/clients"        element={<TempRoute><Clients /></TempRoute>} />
        <Route path="/clients/:id"    element={<TempRoute><ClientDetail /></TempRoute>} />
        <Route path="/settings"       element={<TempRoute><Settings /></TempRoute>} />

      </Route>
    </Routes>
  );
}