import { createContext, useContext, useMemo, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

// ✅ JWT decode — no library needed
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(localStorage.getItem("access_token") || "");
  const [user, setUser]     = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);

  // ✅ Fetch real user info from /auth/me whenever token changes
  useEffect(() => {
    if (!token) { setUser(null); return; }

    const payload = parseJwt(token);
    if (!payload) { setUser(null); return; }

    // Fetch full user profile from backend
    setLoadingUser(true);
    api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("fwt_visited");
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, isAuth: !!token, login, logout, user, loadingUser }),
    [token, user, loadingUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}