import { useState } from "react";
import type { FormEvent } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { routePaths } from "../../../../app/router/route-paths";
import { AppButton } from "../../../../design_system/components/AppButton";
import { AppFeedback } from "../../../../design_system/components/AppFeedback";
import { AppTextField } from "../../../../design_system/components/AppTextField";
import { AuthShell } from "../../../../design_system/components/AuthShell";
import { getAuthErrorMessage } from "../../application/auth-error-message";
import { useAuth } from "../../application/use-auth";
import { resolveGoogleAuthNextRoute } from "../google-auth-next-route";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    setMessage(null);
    setSubmitting(true);

    try {
      await login(email, password);
      setPassword("");
      navigate(routePaths.root, { replace: true });
    } catch (error) {
      setPassword("");
      setMessageTone("error");
      setMessage(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (googleSubmitting) return;

    setMessage(null);
    setGoogleSubmitting(true);

    try {
      const nextStatus = await loginWithGoogle();
      navigate(resolveGoogleAuthNextRoute(nextStatus), { replace: true });
    } catch (error) {
      setMessageTone("error");
      setMessage(getAuthErrorMessage(error));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (resetting) return;

    setMessage(null);
    setResetting(true);

    try {
      await resetPassword(email);
      setMessageTone("success");
      setMessage("Enviamos as instruções de recuperação para o seu e-mail.");
    } catch (error) {
      setMessageTone("error");
      setMessage(getAuthErrorMessage(error));
    } finally {
      setResetting(false);
    }
  };

  return (
    <AuthShell
      mode="login"
      title="Bem-vindo de volta."
      description="Entre para continuar exatamente de onde parou, em qualquer dispositivo."
    >
      <div className="msd-auth-card">
        <header className="msd-auth-card__header">
          <h1>Entre na sua conta</h1>

          <p>
            Use o mesmo e-mail e a mesma senha cadastrados no aplicativo.
          </p>
        </header>

        {message ? (
          <AppFeedback tone={messageTone}>{message}</AppFeedback>
        ) : null}

        <form className="msd-auth-form" onSubmit={handleSubmit} noValidate>
          <AppTextField
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
            disabled={submitting}
            placeholder="voce@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            leadingIcon={<Mail size={19} />}
          />

          <AppTextField
            label="Senha"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            maxLength={256}
            required
            disabled={submitting}
            placeholder="Sua senha"
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
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            }
          />

          <button
            type="button"
            className="msd-auth-inline-action"
            disabled={resetting}
            onClick={() => void handleResetPassword()}
          >
            {resetting ? "Enviando..." : "Esqueci minha senha"}
          </button>

          <div className="msd-auth-actions">
            <AppButton type="submit" fullWidth loading={submitting}>
              Entrar
            </AppButton>

            <div className="msd-auth-divider">ou continue com</div>

            <AppButton
              variant="secondary"
              fullWidth
              loading={googleSubmitting}
              onClick={() => void handleGoogle()}
            >
              Continuar com Google
            </AppButton>
          </div>
        </form>

        <p className="msd-auth-footer">
          Ainda não possui uma conta?{" "}
          <Link to={routePaths.signUp}>Cadastre-se agora</Link>
        </p>
      </div>
    </AuthShell>
  );
};

