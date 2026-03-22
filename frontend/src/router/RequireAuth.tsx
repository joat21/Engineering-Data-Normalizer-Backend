import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthMe } from "../entities/user/api";

export const RequireAuth = () => {
  const { data: user, isLoading, isError } = useAuthMe();
  const location = useLocation();

  if (isLoading) return "Loading...";

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
