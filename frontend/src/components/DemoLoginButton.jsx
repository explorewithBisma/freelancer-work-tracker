import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

// One-click login to the public demo account. The backend issues a token for the
// demo user only; there is no demo password anywhere (not in this bundle either).
export default function DemoLoginButton({ className = "", children = "Try the demo →" }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/demo-login");
      const token = res.data?.access_token;
      if (!token) throw new Error("no token");
      auth.login(token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "The demo is unavailable right now. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={onClick} disabled={loading}>
        {loading ? "Opening demo..." : children}
      </button>
      {error && <div className="auth-error" role="alert" style={{ marginTop: 10 }}>⚠️ {error}</div>}
    </>
  );
}
