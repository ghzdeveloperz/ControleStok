import { Navigate } from "react-router-dom";
import { routePaths } from "../../../../app/router/route-paths";

/**
 * O fluxo oficial de verificação agora acontece dentro de /sign-up.
 * Esta rota permanece como compatibilidade para links e favoritos antigos.
 */
export const VerifyEmailPage = () => <Navigate to={routePaths.signUp} replace />;
