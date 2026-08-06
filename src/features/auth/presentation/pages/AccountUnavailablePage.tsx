import { Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routePaths } from "../../../../app/router/route-paths";
import { AppButton } from "../../../../design_system/components/AppButton";
import { useAuth } from "../../application/use-auth";

export const AccountUnavailablePage = () => {
  const navigate = useNavigate();
  const { statusMessage, logout } = useAuth();

  const leave = async () => {
    await logout();
    navigate(routePaths.access, { replace: true });
  };

  return (
    <main className="msd-state-page">
      <section className="msd-state-card">
        <span className="msd-state-card__icon" aria-hidden="true">
          <Building2 size={34} />
        </span>
        <div>
          <h1>Conta reconhecida</h1>
          <p>
            {statusMessage ??
              "O ambiente Web correspondente a esta conta ainda não está disponível nesta etapa."}
          </p>
        </div>
        <AppButton fullWidth variant="secondary" onClick={() => void leave()}>
          Sair desta conta
        </AppButton>
      </section>
    </main>
  );
};
