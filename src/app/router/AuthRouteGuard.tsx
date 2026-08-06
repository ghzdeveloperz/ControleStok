import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/application/use-auth";
import { hasPendingPasswordSetup } from "../../features/auth/data/registration-session.storage";
import { routePaths } from "./route-paths";

export const AuthRouteGuard = ({ children }: { readonly children: ReactNode }) => {
  const { status } = useAuth();

  if (status === "initializing") return null;

  if (hasPendingPasswordSetup()) {
    return <>{children}</>;
  }

  if (status === "authenticated") return <Navigate to={routePaths.inventory} replace />;
  if (status === "email_verification_required") {
    return <Navigate to={routePaths.signUp} replace />;
  }
  if (status === "company_setup_required") {
    return <Navigate to={routePaths.companySetup} replace />;
  }

  return <>{children}</>;
};
