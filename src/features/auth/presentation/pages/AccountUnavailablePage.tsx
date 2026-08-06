import { Building2 } from "lucide-react";
import { AppButton } from "../../../../design_system/components/AppButton";
import { useAuth } from "../../application/use-auth";

export const AccountUnavailablePage = () => {
  const { statusMessage, logout } = useAuth();

  const leave = async () => {
    await logout();
    window.location.assign("https://mystoreday.com");
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
