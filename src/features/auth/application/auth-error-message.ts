import { FirebaseError } from "firebase/app";
import { AuthSessionError } from "../../../firebase/auth/resolveAuthSession";

const genericCredentialMessage = "E-mail ou senha incorretos.";

const firebaseAuthMessages: Readonly<Record<string, string>> = {
  "auth/email-already-in-use":
    "Este e-mail já possui uma conta. Entre ou recupere sua senha.",

  "auth/invalid-email":
    "Informe um endereço de e-mail válido.",

  "auth/weak-password":
    "Crie uma senha mais forte para proteger sua conta.",

  "auth/too-many-requests":
    "Muitas tentativas. Aguarde alguns minutos e tente novamente.",

  "auth/network-request-failed":
    "Não foi possível conectar ao Firebase. Verifique sua internet.",

  "auth/user-disabled":
    "Sua conta está desativada. Entre em contato com o suporte.",

  "auth/invalid-credential":
    genericCredentialMessage,

  "auth/user-not-found":
    genericCredentialMessage,

  "auth/wrong-password":
    genericCredentialMessage,

  "auth/popup-closed-by-user":
    "A entrada com Google foi cancelada.",

  "auth/popup-blocked":
    "O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.",

  "auth/cancelled-popup-request":
    "Já existe uma tentativa de entrada com Google em andamento.",

  "auth/account-exists-with-different-credential":
    "Este e-mail já está vinculado a outro método de acesso.",

  "auth/requires-recent-login":
    "Entre novamente para concluir esta ação.",

  "auth/operation-not-allowed":
    "O login com Google não está habilitado no Firebase Authentication.",

  "auth/unauthorized-domain":
    "Este domínio não está autorizado no Firebase Authentication.",

  "auth/invalid-api-key":
    "A chave da API Firebase configurada na web é inválida.",

  "auth/app-not-authorized":
    "Esta aplicação web não está autorizada a usar o Firebase Authentication.",

  "auth/internal-error":
    "O Firebase retornou um erro interno durante o login com Google.",

  "auth/web-storage-unsupported":
    "O navegador bloqueou o armazenamento necessário para manter a autenticação.",

  "auth/argument-error":
    "A configuração enviada para o login com Google é inválida.",
};

const developmentFirebaseMessage = (error: FirebaseError): string => {
  if (!import.meta.env.DEV) {
    return "Não foi possível concluir a entrada com Google.";
  }

  return `Firebase: ${error.code} — ${error.message}`;
};

export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof AuthSessionError) {
    switch (error.code) {
      case "AUTH_EMAIL_NOT_VERIFIED":
        return "Confirme seu e-mail para continuar.";

      case "AUTH_ACCOUNT_INACTIVE":
        return "Sua conta está inativa ou bloqueada. Entre em contato com o suporte.";

      case "AUTH_ACCOUNT_NOT_CONFIGURED":
      case "AUTH_NO_ACTIVE_WORKSPACE":
        return "A configuração da empresa ainda não foi concluída.";

      case "AUTH_UNSUPPORTED_ACCOUNT":
        return "O ambiente Web desta conta ainda não está disponível.";

      case "AUTH_SHARED_WORKSPACE_UNSUPPORTED":
        return "Este workspace compartilhado ainda não está disponível no Web.";

      case "AUTH_SESSION_UNAVAILABLE":
        return "Não foi possível validar sua empresa agora. Verifique sua conexão.";

      case "AUTH_INVALID_SESSION":
        return "Sua sessão não pôde ser validada. Entre novamente.";

      case "AUTH_INVALID_CREDENTIALS":
        return genericCredentialMessage;
    }
  }

  if (error instanceof FirebaseError) {
    console.error("[Auth] Firebase Authentication error", {
      code: error.code,
      message: error.message,
      name: error.name,
      customData: error.customData,
    });

    return firebaseAuthMessages[error.code] ?? developmentFirebaseMessage(error);
  }

  if (error instanceof Error) {
    console.error("[Auth] Unexpected authentication error", error);

    if (error.message.trim()) {
      return import.meta.env.DEV
        ? error.message
        : "Não foi possível concluir a entrada com Google.";
    }
  }

  console.error("[Auth] Unknown authentication error", error);

  return "Não foi possível concluir a entrada com Google.";
};
