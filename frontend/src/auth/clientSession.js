// Client-portal session. Completely separate from the freelancer session
// ("access_token"): different storage key, different axios instance, different guard.
const CLIENT_TOKEN_KEY = "client_token";

export const getClientToken = () => localStorage.getItem(CLIENT_TOKEN_KEY);
export const setClientToken = (token) => localStorage.setItem(CLIENT_TOKEN_KEY, token);
export const clearClientToken = () => localStorage.removeItem(CLIENT_TOKEN_KEY);

// Pages that belong to the client area. They must never be redirected to, or
// wrapped by, anything from the freelancer app.
export const isClientAreaPath = (pathname = "") => pathname.startsWith("/client-");
