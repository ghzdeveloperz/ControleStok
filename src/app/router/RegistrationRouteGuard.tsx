import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/application/use-auth";
import { routePaths } from "./route-paths";

export const RegistrationRouteGuard = ({
  stage,
  children,
}: {
  readonly stage: "verification" | "company";
  readonly children: ReactNode;
}) => {
  const { status } = useAuth();

  if (status === "initializing") return null;

  if (stage === "verification" && status !== "email_verification_required") {
    return <Navigate to={routePaths.signUp} replace />;
  }

  if (stage === "company" && status !== "company_setup_required") {
    return <Navigate to={routePaths.root} replace />;
  }

  return <>{children}</>;
};
