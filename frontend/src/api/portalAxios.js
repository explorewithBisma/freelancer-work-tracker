import axios from "axios";
import { API_BASE_URL } from "./config";
import { getClientToken, clearClientToken } from "../auth/clientSession";

// API instance for the client portal. It only ever sends the CLIENT token and
// never touches the freelancer session ("access_token").
const portalApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

portalApi.interceptors.request.use((config) => {
  const token = getClientToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    // A rejected client session (401/403) clears only the client token. No hard
    // redirect: the page (or ClientRoute) sends the user to /client-login.
    // Failed logins are left alone so the form can show its own error.
    if ((status === 401 || status === 403) && !url.includes("/client-portal/login")) {
      clearClientToken();
    }
    return Promise.reject(error);
  }
);

export default portalApi;
