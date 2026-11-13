import axios from "axios";
import { API_BASE_URL } from "./config";
import { isClientAreaPath } from "../auth/clientSession";

// API instance for the FREELANCER app. It only knows the freelancer session
// ("access_token"). Client-portal pages use api/portalAxios.js instead.
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  }
});

const isAuthRoute = (url) => url.includes("/auth/login") || url.includes("/auth/register");
const isPortalRoute = (url) => url.includes("/client-portal");

// Request Interceptor: attach the freelancer JWT (never to client-portal calls)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  const url = config.url || "";

  if (token && !isAuthRoute(url) && !isPortalRoute(url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: a 401 means the freelancer session is invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    // Failed login/register: let the form show its own inline error (no reload).
    // Client-portal calls: not part of the freelancer session.
    if (error.response?.status === 401 && !isAuthRoute(url) && !isPortalRoute(url)) {
      console.warn("Session expired. Redirecting to login...");
      localStorage.removeItem("access_token");
      // Never pull someone on a client-portal page into the freelancer login.
      if (!isClientAreaPath(window.location.pathname)) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
