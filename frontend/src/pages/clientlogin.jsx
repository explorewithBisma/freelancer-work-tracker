import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./auth.css";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const res = await api.post("/client-portal/login", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      localStorage.setItem("client_token", res.data.access_token);
      navigate("/client-portal");
    } catch (err) {
      setError(err.response?.status === 401
        ? "Incorrect email or password."
        : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">

        <div className="auth-brand">
          <div className="auth-brand-dot" style={{ background: "linear-gradient(135deg,#1d7874,#2a9d8f)" }}>C</div>
          <span className="auth-brand-name">Client Portal</span>
        </div>

        <h1 className="auth-heading">Welcome, <span>Client!</span></h1>
        <p className="auth-sub">Sign in to track your project progress and invoices.</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-field-wrap">
            <label className="auth-label">Email Address</label>
            <div className="auth-field">
              <span className="auth-field-icon">✉️</span>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required/>
            </div>
          </div>
          <div className="auth-field-wrap">
            <label className="auth-label">Password</label>
            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input type={showPwd ? "text" : "password"} placeholder="Your portal password"
                value={password} onChange={e => setPassword(e.target.value)} required/>
              <button type="button" className="auth-eye-btn" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          <button className="auth-submit" type="submit" disabled={loading}
            style={{ background: "linear-gradient(90deg,#1d7874,#2a9d8f)", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Signing in..." : "View My Projects →"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>
        <div className="auth-footer">
          <Link to="/login" className="auth-link-small">← Freelancer Login</Link>
        </div>
      </div>
    </div>
  );
}