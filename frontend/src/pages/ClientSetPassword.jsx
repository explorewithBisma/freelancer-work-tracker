import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./auth.css";
import api from "../api/axios";

export default function ClientSetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirm]     = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [error, setError]                 = useState("");
  const [done, setDone]                   = useState(false);
  const [loading, setLoading]             = useState(false);

  // No token in URL — show error
  if (!token) {
    return (
      <div className="auth-wrap">
        <div className="auth-box">
          <div className="auth-brand">
            <div className="auth-brand-dot">F</div>
            <span className="auth-brand-name">Freelancer Work Tracker</span>
          </div>
          <div className="auth-error" style={{ marginTop: 16 }}>
            ⚠️ Invalid or missing link. Please ask your freelancer to send a new invitation.
          </div>
          <div className="auth-footer" style={{ marginTop: 20 }}>
            <Link to="/client-login">Go to client login</Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/client-portal/set-password-with-token", {
        token,
        password,
      });
      setDone(true);
      // Auto redirect to login after 3 seconds
      setTimeout(() => navigate("/client-login"), 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Could not set password. The link may have expired."
      );
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
            <h1 className="auth-heading">
              Set your <span>password</span>
            </h1>
            <p className="auth-sub">
              Choose a password (at least 8 characters) for your client portal account.
            </p>

            {error && <div className="auth-error">⚠️ {error}</div>}

            <form className="auth-form" onSubmit={onSubmit}>

              {/* New Password */}
              <div className="auth-field-wrap">
                <label className="auth-label">New Password</label>
                <div className="auth-field">
                  <span className="auth-field-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="auth-field-wrap">
                <label className="auth-label">Confirm Password</label>
                <div className="auth-field">
                  <span className="auth-field-icon">🔒</span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Password match indicator */}
              {confirmPassword && (
                <p style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: password === confirmPassword ? "#16a34a" : "#dc2626",
                  margin: "-4px 0 0",
                }}>
                  {password === confirmPassword ? "✅ Passwords match" : "❌ Passwords do not match"}
                </p>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Saving..." : "Set Password →"}
              </button>

            </form>

            <div className="auth-footer" style={{ marginTop: 20 }}>
              <Link to="/client-login">← Back to Client Login</Link>
            </div>
          </>
        ) : (
          /* Success state */
          <div className="auth-success">
            <span className="auth-success-icon">✅</span>
            <h3>Password set!</h3>
            <p>
              Your password has been saved.
              Redirecting you to the client login in 3 seconds...
            </p>
            <Link
              to="/client-login"
              className="auth-submit"
              style={{ display: "block", textDecoration: "none", textAlign: "center" }}
            >
              Go to Client Login →
            </Link>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/" className="auth-link-small">← Back to Home</Link>
        </div>

      </div>
    </div>
  );
}