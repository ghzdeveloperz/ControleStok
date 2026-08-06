import { CloudOff } from "lucide-react";
import { AppButton } from "../../../../design_system/components/AppButton";
import { useAuth } from "../../application/use-auth";

export const AuthErrorPage = () => {
  const { statusMessage, refreshAccount, logout } = useAuth();

  return (
    <main className="msd-state-page">
      <section className="msd-state-card">
        <span className="msd-state-card__icon" aria-hidden="true">
          <CloudOff size={34} />
        </span>
        <div>
          <h1>Não foi possível abrir</h1>
          <p>{statusMessage ?? "Não foi possível validar sua conta agora."}</p>
        </div>
        <div className="msd-auth-actions" style={{ width: "100%" }}>
          <AppButton fullWidth onClick={() => void refreshAccount()}>
            Tentar novamente
          </AppButton>
          <AppButton fullWidth variant="ghost" onClick={() => void logout()}>
            Sair da conta
          </AppButton>
        </div>
      </section>
    </main>
  );
};
