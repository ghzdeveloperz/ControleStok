import { Navigate, Route, Routes } from "react-router-dom";
import { WorkspaceLayout } from "../layouts/WorkspaceLayout";
import { AuthRouteGuard } from "./AuthRouteGuard";
import { RegistrationRouteGuard } from "./RegistrationRouteGuard";
import { routePaths } from "./route-paths";
import { useAuth } from "../../features/auth/application/use-auth";
import { AccountUnavailablePage } from "../../features/auth/presentation/pages/AccountUnavailablePage";
import { AuthChoicePage } from "../../features/auth/presentation/pages/AuthChoicePage";
import { AuthErrorPage } from "../../features/auth/presentation/pages/AuthErrorPage";
import { LoginPage } from "../../features/auth/presentation/pages/LoginPage";
import { SignUpPage } from "../../features/auth/presentation/pages/SignUpPage";
import { VerifyEmailPage } from "../../features/auth/presentation/pages/VerifyEmailPage";
import { CompanySetupPage } from "../../features/onboarding/presentation/pages/CompanySetupPage";
import Home from "../../pages/Home";
import PrivacyPolicy from "../../pages/PrivacyPolicy";
import TermsOfUse from "../../pages/TermsOfUse";

const StartupPage = () => (
  <main className="msd-page-loader">
    <div className="msd-page-loader__content" role="status" aria-live="polite">
      <span className="msd-spinner" aria-hidden="true" />
      <span>Preparando sua conta...</span>
    </div>
  </main>
);

export const AppRouter = () => {
  const { status, session, logout } = useAuth();

  if (status === "initializing") return <StartupPage />;
  if (status === "unsupported_account") return <AccountUnavailablePage />;
  if (status === "error") return <AuthErrorPage />;

  if (status === "authenticated" && session) {
    return <WorkspaceLayout key={session.workspaceId} session={session} onLogout={logout} />;
  }

  return (
    <Routes>
      <Route path={routePaths.root} element={<Home />} />
      <Route path={routePaths.access} element={<AuthRouteGuard><AuthChoicePage /></AuthRouteGuard>} />
      <Route path={routePaths.login} element={<AuthRouteGuard><LoginPage /></AuthRouteGuard>} />
      <Route path={routePaths.signUp} element={<AuthRouteGuard><SignUpPage /></AuthRouteGuard>} />
      <Route path={routePaths.verifyEmail} element={<RegistrationRouteGuard stage="verification"><VerifyEmailPage /></RegistrationRouteGuard>} />
      <Route path={routePaths.companySetup} element={<RegistrationRouteGuard stage="company"><CompanySetupPage /></RegistrationRouteGuard>} />
      <Route path={routePaths.privacy} element={<PrivacyPolicy />} />
      <Route path={routePaths.terms} element={<TermsOfUse />} />

      <Route path={routePaths.legacy.access} element={<Navigate to={routePaths.access} replace />} />
      <Route path={routePaths.legacy.register} element={<Navigate to={routePaths.signUp} replace />} />
      <Route path={routePaths.legacy.verifyEmail} element={<Navigate to={routePaths.verifyEmail} replace />} />
      <Route path={routePaths.legacy.companySetup} element={<Navigate to={routePaths.companySetup} replace />} />
      <Route path={routePaths.legacy.inventory} element={<Navigate to={routePaths.inventory} replace />} />
      <Route path={routePaths.legacy.newProduct} element={<Navigate to={routePaths.newProduct} replace />} />
      <Route path={routePaths.legacy.reports} element={<Navigate to={routePaths.reports} replace />} />
      <Route path={routePaths.legacy.alerts} element={<Navigate to={routePaths.alerts} replace />} />
      <Route path={routePaths.legacy.settings} element={<Navigate to={routePaths.settings} replace />} />
      <Route path={routePaths.legacy.privacy} element={<Navigate to={routePaths.privacy} replace />} />
      <Route path="*" element={<Navigate to={routePaths.root} replace />} />
    </Routes>
  );
};
