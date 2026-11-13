import { Navigate } from "react-router-dom";
import { getClientToken } from "./clientSession";

// Guard for client-portal pages: looks ONLY at the client session.
export default function ClientRoute({ children }) {
  if (!getClientToken()) return <Navigate to="/client-login" replace />;
  return children;
}
