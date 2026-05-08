import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./auth.css";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const auth      = useAuth();

  const successMsg = location.state?.message;

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [countdown, setCountdown]       = useState(0);



  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = res.data?.access_token;
      if (!token) {
        setError("Login failed. Please try again.");
        return;
      }

      localStorage.setItem("access_token", token);
      auth.login(token);
      navigate("/dashboard", { replace: true });

    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;

      if (status === 401) {
        setError("Incorrect email or password. Please try again.");
      } else if (status === 422) {
        setError("Please enter a valid email address.");
      } else {
        setError(detail || "Something went wrong. Please try again.");
      }

      // ✅ Show error 5 seconds with countdown then clear fields
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setError("");
        setEmail("");
        setPassword("");
        setCountdown(0);
      }, 5000);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-box">

        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-dot">F</div>
          <span className="auth-brand-name">Freelancer Work Tracker</span>
        </div>

        {/* Heading */}
        <h1 className="auth-heading">Welcome <span>back!</span></h1>
        <p className="auth-sub">Sign in to continue to your workspace.</p>

        {/* Success message from register */}
        {successMsg && (
          <div className="auth-success-msg">✓ {successMsg}</div>
        )}

        {/* Error with countdown */}
        {error && (
          <div className="auth-error">
            ⚠️ {error}
            {countdown > 0 && (
              <span className="auth-error-countdown"> Resetting in {countdown}s...</span>
            )}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={onSubmit}>

          <div className="auth-field-wrap">
            <label className="auth-label">Email Address</label>
            <div className="auth-field">
              <span className="auth-field-icon">✉️</span>
              <input
                type="email"
                placeholder="someone@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field-wrap">
            <label className="auth-label">Password</label>
            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginTop: "-4px" }}>
            <Link to="/forgot-password" className="auth-link-small">Forgot password?</Link>
          </div>

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-footer">
          <span>Don't have an account?</span>
          <Link to="/register">Create one</Link>
        </div>

        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/" className="auth-link-small">← Back to Home</Link>
        </div>

      </div>
    </div>
  );
}