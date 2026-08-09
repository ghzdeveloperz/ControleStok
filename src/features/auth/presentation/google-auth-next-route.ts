import { routePaths } from "../../../app/router/route-paths";
import type { AuthStatus } from "../domain/auth.types";

export const resolveGoogleAuthNextRoute = (status: AuthStatus): string => {
  switch (status) {
    case "company_setup_required":
      return routePaths.companySetup;
    case "email_verification_required":
      return routePaths.signUp;
    case "authenticated":
      return routePaths.inventory;
    case "unsupported_account":
    case "error":
    case "initializing":
    case "unauthenticated":
      return routePaths.root;
  }
};
