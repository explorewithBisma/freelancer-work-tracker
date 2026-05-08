import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function TempRoute({ children }) {
  const auth = useAuth();
  const isAuth = auth?.isAuth;

  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}
