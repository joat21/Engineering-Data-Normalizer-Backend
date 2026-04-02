import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthMe } from "@/entities/user/api";
import { PageLoader } from "@/shared/ui";

export const RequireAuth = () => {
  const { data: user, isLoading, isError } = useAuthMe();
  const location = useLocation();

  if (isLoading) return <PageLoader />;

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
