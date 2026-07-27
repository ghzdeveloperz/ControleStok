import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { Lock, LogIn, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const Login = () => {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      await login(loginValue, password);
      setPassword("");
      navigate("/estoque", { replace: true });
    } catch (caught) {
      const temporarilyBlocked =
        caught instanceof FirebaseError &&
        caught.code === "functions/resource-exhausted";

      setError(
        temporarilyBlocked
          ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
          : "Login ou senha incorretos.",
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
      >
        <div className="pt-10 text-center">
          <h2 className="flex items-center justify-center gap-2 text-2xl font-extrabold tracking-wide text-gray-800">
            <LogIn size={28} className="text-gray-700" /> Painel de Controle
          </h2>
          <p className="mt-1 text-sm text-gray-500">Acesse seu estoque</p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-100 py-2 text-center text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        <div className="relative">
          <User className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={128}
            required
            placeholder="Login"
            value={loginValue}
            onChange={(event) => setLoginValue(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-gray-100 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            maxLength={256}
            required
            placeholder="Senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-gray-100 py-3 pl-10 pr-4 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-xl bg-blue-600 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Esqueceu a senha? Consulte o administrador.
        </p>
      </form>
    </div>
  );
};
