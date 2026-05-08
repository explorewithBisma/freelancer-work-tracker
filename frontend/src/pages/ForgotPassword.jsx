import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./auth.css";
import api from "../api/axios";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Try again.");
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

        {!done ? (
          <>
            {/* Heading */}
            <h1 className="auth-heading">
              Reset your <span>password</span>
            </h1>
            <p className="auth-sub">
              Enter your registered email and we'll send you a reset link.
            </p>

            {/* Error */}
            {error && <div className="auth-error">⚠️ {error}</div>}

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

              <div className="auth-info-box">
                💡 Check both your inbox and spam folder. The link expires in 15 minutes.
              </div>

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? "Sending link..." : "Send Reset Link →"}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <div className="auth-footer">
              <Link to="/login">← Back to Login</Link>
              <span style={{ color: "#d1c8f0" }}>•</span>
              <Link to="/register">Create account</Link>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="auth-success">
            <span className="auth-success-icon">📬</span>
            <h3>Check your inbox!</h3>
            <p>
              If <strong>{email}</strong> is registered, you'll receive a password
              reset link shortly. Check spam too!
            </p>
            <Link to="/login" className="auth-submit" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
              Back to Login →
            </Link>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: 16 }}>
          <Link to="/" className="auth-link-small">← Back to Home</Link>
        </div>

      </div>
    </div>
  );
}