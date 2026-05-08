import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  }
  // ✅ withCredentials hataya — JWT tokens ke saath zarurat nahi
  // aur yeh CORS errors create karta tha
});

// Request Interceptor: JWT Token attach karo
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  const url = config.url || "";

  const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");

  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: 401 handle karo
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expired. Redirecting to login...");
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;