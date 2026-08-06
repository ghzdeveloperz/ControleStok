import { FirebaseError } from "firebase/app";
import { AuthSessionError } from "../../../firebase/auth/resolveAuthSession";

const genericCredentialMessage = "E-mail ou senha incorretos.";

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
    switch (error.code) {
      case "auth/email-already-in-use":
        return "Este e-mail já possui uma conta. Entre ou recupere sua senha.";
      case "auth/invalid-email":
        return "Informe um endereço de e-mail válido.";
      case "auth/weak-password":
        return "Crie uma senha mais forte para proteger sua conta.";
      case "auth/too-many-requests":
        return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      case "auth/network-request-failed":
        return "Não foi possível conectar. Verifique sua internet.";
      case "auth/user-disabled":
        return "Sua conta está desativada. Entre em contato com o suporte.";
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return genericCredentialMessage;
      case "auth/popup-closed-by-user":
        return "A entrada com Google foi cancelada.";
      case "auth/popup-blocked":
        return "O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.";
      case "auth/account-exists-with-different-credential":
        return "Este e-mail já está vinculado a outro método de acesso.";
      case "auth/requires-recent-login":
        return "Entre novamente para concluir esta ação.";
      case "auth/operation-not-allowed":
        return "Este método de autenticação não está habilitado.";
      default:
        return "Não foi possível concluir a operação agora.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Não foi possível concluir a operação agora.";
};
