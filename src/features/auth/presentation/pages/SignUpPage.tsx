import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Clock3, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { routePaths } from "../../../../app/router/route-paths";
import { AppButton } from "../../../../design_system/components/AppButton";
import { AppFeedback } from "../../../../design_system/components/AppFeedback";
import { AppTextField } from "../../../../design_system/components/AppTextField";
import { AuthShell } from "../../../../design_system/components/AuthShell";
import { useAuth } from "../../application/use-auth";
import { useSignUpFlow } from "../../application/use-sign-up-flow";
import { evaluatePasswordStrength } from "../../domain/password-strength";
import { PasswordStrength } from "../components/PasswordStrength";

export const SignUpPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, refreshAccount } = useAuth();
  const {
    state,
    isEmailValid,
    setEmail,
    sendVerification,
    resendVerification,
    changeEmail,
    completePassword,
  } = useSignUpFlow();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const passwordsMatch = confirmation.length > 0 && password === confirmation;
  const canCreateAccount = strength.isAcceptable && passwordsMatch && !state.busy;

  const handleGoogle = async () => {
    if (googleSubmitting) return;
    setLocalError(null);
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(routePaths.companySetup, { replace: true });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Não foi possível continuar com Google.");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateAccount) return;

    setLocalError(null);
    try {
      await completePassword(password);
      setPassword("");
      setConfirmation("");
      await refreshAccount();
      navigate(routePaths.companySetup, { replace: true });
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    }
  };

  return (
    <AuthShell
      mode="register"
      title="Crie sua conta MyStoreDay."
      description="Comece no Web e continue no mobile usando a mesma identidade e a mesma empresa."
    >
      <div className="msd-auth-card">
        <header className="msd-auth-card__header">
          <h1>Crie sua conta</h1>
          <p>
            {state.stage === "password_setup"
              ? "Seu e-mail foi confirmado. Defina uma senha segura para continuar."
              : "Confirme seu e-mail antes de definir a senha e configurar sua empresa."}
          </p>
        </header>

        {state.feedback ? (
          <AppFeedback tone={state.feedbackTone}>{state.feedback}</AppFeedback>
        ) : null}
        {localError ? <AppFeedback tone="error">{localError}</AppFeedback> : null}

        {state.stage === "email_entry" ? (
          <div className="msd-auth-form">
            <AppTextField
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
              disabled={state.busy}
              placeholder="voce@empresa.com"
              value={state.email}
              onChange={(event) => setEmail(event.target.value)}
              leadingIcon={<Mail size={19} />}
            />

            {isEmailValid ? (
              <AppButton
                fullWidth
                loading={state.busy}
                onClick={() => void sendVerification()}
              >
                Enviar e-mail de verificação
              </AppButton>
            ) : null}

            <div className="msd-auth-divider">ou continue com</div>

            <AppButton
              variant="secondary"
              fullWidth
              loading={googleSubmitting}
              disabled={state.busy}
              onClick={() => void handleGoogle()}
            >
              Continuar com Google
            </AppButton>
          </div>
        ) : null}

        {state.stage === "verification_pending" ? (
          <div className="msd-auth-form">
            <AppTextField
              label="E-mail em verificação"
              type="email"
              value={state.email}
              readOnly
              disabled
              leadingIcon={<Mail size={19} />}
            />

            <div className="msd-registration-status" role="status" aria-live="polite">
              <Clock3 size={20} aria-hidden="true" />
              <div>
                <strong>Aguardando sua confirmação</strong>
                <span>Abra o link enviado para o e-mail informado.</span>
              </div>
            </div>

            <AppButton
              fullWidth
              variant="secondary"
              loading={state.busy}
              disabled={state.cooldown > 0}
              onClick={() => void resendVerification()}
            >
              {state.cooldown > 0
                ? `Reenviar em ${state.cooldown}s`
                : "Reenviar e-mail de verificação"}
            </AppButton>

            <AppButton fullWidth variant="ghost" onClick={changeEmail}>
              Não é esse e-mail?
            </AppButton>
          </div>
        ) : null}

        {state.stage === "password_setup" ? (
          <form className="msd-auth-form" onSubmit={submitPassword} noValidate>
            <AppTextField
              label="E-mail verificado"
              type="email"
              value={state.email}
              readOnly
              disabled
              leadingIcon={<CheckCircle2 size={19} />}
              helperText="Este e-mail não pode ser alterado nesta etapa."
            />

            <AppTextField
              label="Senha"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              maxLength={256}
              required
              disabled={state.busy}
              placeholder="Crie uma senha forte"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              leadingIcon={<Lock size={19} />}
              trailingAction={
                <button
                  type="button"
                  className="msd-field__action"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <PasswordStrength password={password} />

            <AppTextField
              label="Confirme a senha"
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              maxLength={256}
              required
              disabled={state.busy}
              placeholder="Digite a senha novamente"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              leadingIcon={<Lock size={19} />}
              error={confirmation && !passwordsMatch ? "As senhas não coincidem." : undefined}
              trailingAction={
                <button
                  type="button"
                  className="msd-field__action"
                  aria-label={showConfirmation ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowConfirmation((current) => !current)}
                >
                  {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <AppButton type="submit" fullWidth loading={state.busy} disabled={!canCreateAccount}>
              Criar conta
            </AppButton>
          </form>
        ) : null}

        <p className="msd-auth-footer">
          Já possui uma conta? <Link to={routePaths.login}>Entrar agora</Link>
        </p>
      </div>
    </AuthShell>
  );
};
