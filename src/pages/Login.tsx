// caminho: src/pages/Login.tsx

import {
  useState,
} from "react";
import type {
  FormEvent,
} from "react";

import {
  FirebaseError,
} from "firebase/app";
import {
  Lock,
  LogIn,
  Mail,
} from "lucide-react";
import {
  useNavigate,
} from "react-router-dom";

import {
  AuthSessionError,
} from "../firebase/auth/resolveAuthSession";
import {
  useAuth,
} from "../hooks/useAuth";

const genericCredentialMessage =
  "E-mail ou senha incorretos.";

const resolveLoginErrorMessage = (
  error: unknown,
): string => {
  if (
    error instanceof AuthSessionError
  ) {
    switch (error.code) {
      case "AUTH_EMAIL_NOT_VERIFIED":
        return "Seu e-mail ainda não foi verificado. Verifique sua caixa de entrada e tente novamente.";

      case "AUTH_ACCOUNT_INACTIVE":
        return "Sua conta está inativa ou bloqueada. Entre em contato com o suporte.";

      case "AUTH_ACCOUNT_NOT_CONFIGURED":
        return "A empresa ainda não foi configurada. Conclua a configuração pelo aplicativo MyStoreDay.";

      case "AUTH_UNSUPPORTED_ACCOUNT":
        return "Este painel Web está disponível atualmente apenas para contas de comerciante.";

      case "AUTH_SHARED_WORKSPACE_UNSUPPORTED":
        return "O acesso Web a estoques compartilhados ainda não está habilitado. Acesse esse estoque pelo aplicativo.";

      case "AUTH_NO_ACTIVE_WORKSPACE":
        return "Nenhuma empresa ativa foi encontrada para esta conta.";

      case "AUTH_SESSION_UNAVAILABLE":
        return "Não foi possível validar sua empresa agora. Verifique sua conexão e tente novamente.";

      case "AUTH_INVALID_SESSION":
        return "Não foi possível validar sua sessão. Faça o login novamente.";

      case "AUTH_INVALID_CREDENTIALS":
        return genericCredentialMessage;
    }
  }

  if (
    error instanceof FirebaseError
  ) {
    switch (error.code) {
      case "auth/too-many-requests":
        return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";

      case "auth/network-request-failed":
        return "Não foi possível conectar ao Firebase. Verifique sua internet.";

      case "auth/user-disabled":
        return "Sua conta está desativada. Entre em contato com o suporte.";

      case "auth/invalid-email":
        return "Informe um endereço de e-mail válido.";

      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return genericCredentialMessage;

      case "auth/operation-not-allowed":
        return "O login por e-mail e senha não está habilitado no Firebase.";

      default:
        return "Não foi possível entrar agora. Tente novamente.";
    }
  }

  return "Não foi possível entrar agora. Tente novamente.";
};

export const Login = () => {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const navigate =
    useNavigate();

  const {
    login,
  } = useAuth();

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      normalizedEmail.length === 0 ||
      password.length === 0
    ) {
      setError(
        genericCredentialMessage,
      );

      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await login(
        normalizedEmail,
        password,
      );

      setPassword("");

      navigate(
        "/estoque",
        {
          replace: true,
        },
      );
    } catch (caught) {
      setPassword("");

      setError(
        resolveLoginErrorMessage(
          caught,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 via-white to-blue-50 p-6">
      <form
        className="relative flex w-full max-w-sm select-none flex-col gap-6 rounded-3xl border border-gray-200 bg-white p-10 shadow-xl animate-fadeIn"
        onSubmit={handleLogin}
        noValidate
      >
        <div className="pt-10 text-center">
          <h1 className="flex items-center justify-center gap-2 text-2xl font-extrabold tracking-wide text-gray-800">
            <LogIn
              size={28}
              className="text-gray-700"
              aria-hidden="true"
            />

            Painel de Controle
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Acesse seu estoque
          </p>
        </div>

        {error && (
          <p
            role="alert"
            aria-live="polite"
            className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-center text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        <label className="relative block">
          <span className="sr-only">
            E-mail
          </span>

          <Mail
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
            aria-hidden="true"
          />

          <input
            type="email"
            name="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
            disabled={submitting}
            placeholder="E-mail"
            value={email}
            onChange={(event) => {
              setEmail(
                event.target.value,
              );
            }}
            className="w-full rounded-xl border border-gray-300 bg-gray-100 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-500 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>

        <label className="relative block">
          <span className="sr-only">
            Senha
          </span>

          <Lock
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
            aria-hidden="true"
          />

          <input
            type="password"
            name="password"
            autoComplete="current-password"
            maxLength={256}
            required
            disabled={submitting}
            placeholder="Senha"
            value={password}
            onChange={(event) => {
              setPassword(
                event.target.value,
              );
            }}
            className="w-full rounded-xl border border-gray-300 bg-gray-100 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-500 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-70"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-xl bg-blue-600 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Validando..."
            : "Entrar"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Esqueceu a senha? Consulte o administrador.
        </p>
      </form>
    </div>
  );
};
