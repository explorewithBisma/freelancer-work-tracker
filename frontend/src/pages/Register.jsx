import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import api from "../api/axios";

// ── Password strength checker ──
const checkPassword = (pwd) => {
  return {
    length:    pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number:    /[0-9]/.test(pwd),
    symbol:    /[!@#$%^&*()_+\-={}[\];':"\\|,.<>/?]/.test(pwd),
  };
};

const strengthLabel = (checks) => {
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2) return { label: "Weak",   color: "#ef4444", width: "25%" };
  if (passed === 3) return { label: "Fair",   color: "#f97316", width: "50%" };
  if (passed === 4) return { label: "Good",   color: "#eab308", width: "75%" };
  return              { label: "Strong", color: "#22c55e", width: "100%" };
};

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [touched, setTouched]         = useState(false);

  const checks   = useMemo(() => checkPassword(password), [password]);
  const strength = useMemo(() => strengthLabel(checks),   [checks]);
  const allValid = Object.values(checks).every(Boolean);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTouched(true);

    if (!allValid) {
      setError("Please meet all password requirements before continuing.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", { full_name: fullName, email, password });
      navigate("/login", {
        state: { message: "Account created successfully! Please login." }
      });
    } catch (err) {
      const serverError =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        "Registration failed. Try a different email.";
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  const RuleRow = ({ ok, label }) => (
    <div className="pwd-rule">
      <span className={`pwd-rule-dot ${ok ? "ok" : "no"}`}>
        {ok ? "✓" : "✕"}
      </span>
      <span className={ok ? "pwd-rule-text ok" : "pwd-rule-text"}>{label}</span>
    </div>
  );

  return (
    <div className="auth-wrap">
      <div className="auth-box">

        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-dot">F</div>
          <span className="auth-brand-name">Freelancer Work Tracker</span>
        </div>

        {/* Heading */}
        <h1 className="auth-heading">Create your <span>account</span></h1>
        <p className="auth-sub">Join thousands of freelancers managing work smarter.</p>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>

          {/* Full Name */}
          <div className="auth-field-wrap">
            <label className="auth-label">Full Name</label>
            <div className="auth-field">
              <span className="auth-field-icon">👤</span>
              <input type="text" placeholder="Your full name" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required/>
            </div>
          </div>

          {/* Email */}
          <div className="auth-field-wrap">
            <label className="auth-label">Email Address</label>
            <div className="auth-field">
              <span className="auth-field-icon">✉️</span>
              <input type="email" placeholder="someone@gmail.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required/>
            </div>
          </div>

          {/* Password */}
          <div className="auth-field-wrap">
            <label className="auth-label">Password</label>
            <div className="auth-field">
              <span className="auth-field-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                required
              />
              <button type="button" className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            {/* Strength bar — shows when user starts typing */}
            {touched && password.length > 0 && (
              <div className="pwd-strength-wrap">
                <div className="pwd-strength-bar">
                  <div className="pwd-strength-fill"
                    style={{ width: strength.width, background: strength.color }}/>
                </div>
                <span className="pwd-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}

            {/* Rules checklist */}
            {touched && password.length > 0 && (
              <div className="pwd-rules">
                <RuleRow ok={checks.length}    label="At least 8 characters" />
                <RuleRow ok={checks.uppercase} label="One uppercase letter (A-Z)" />
                <RuleRow ok={checks.lowercase} label="One lowercase letter (a-z)" />
                <RuleRow ok={checks.number}    label="One number (0-9)" />
                <RuleRow ok={checks.symbol}    label="One special character (!@#$...)" />
              </div>
            )}
          </div>

          <button className="auth-submit" type="submit"
            disabled={loading || (touched && !allValid)}
            style={{ opacity: (loading || (touched && !allValid)) ? 0.7 : 1 }}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login"> Sign in</Link>
        </div>

        <div className="auth-footer" style={{ marginTop: 8 }}>
          <Link to="/" className="auth-link-small">← Back to Home</Link>
        </div>

      </div>
    </div>
  );
}