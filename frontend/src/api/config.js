// Single source of truth for the backend URL.
// Set REACT_APP_API_URL (e.g. in Vercel) for production; falls back to local dev.
export const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");
