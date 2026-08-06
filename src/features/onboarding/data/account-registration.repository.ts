import { getToken } from "firebase/app-check";
import { backendEndpoints } from "../../../core/config/backend-endpoints";
import { cnpjOnlyDigits, formatCnpj, isValidCnpj } from "../../../core/validation/cnpj";
import { appCheck, auth } from "../../../firebase/firebase";
import type {
  AccountType,
  CompleteCompanyRegistrationInput,
  CompleteCompanyRegistrationResult,
} from "../domain/company.types";

export class AccountRegistrationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AccountRegistrationError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const isAccountType = (value: unknown): value is AccountType =>
  value === "merchant" || value === "supplier";

const readJson = (text: string): Record<string, unknown> => {
  if (!text.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
};

const messageFromPayload = (payload: Record<string, unknown>): string => {
  const serverMessage = typeof payload.message === "string" ? payload.message.trim() : "";
  if (serverMessage) return serverMessage;

  const code = typeof payload.code === "string" ? payload.code : "registration-failed";
  switch (code) {
    case "email-not-verified":
    case "email_not_verified":
      return "Confirme seu e-mail antes de continuar.";
    case "company-document-invalid":
    case "company_document_invalid":
      return "Informe um CNPJ válido.";
    case "legal-required":
    case "legal_required":
      return "Aceite os termos e a política de privacidade para continuar.";
    case "account-type-conflict":
    case "account_type_conflict":
      return "Esta conta já foi criada com outro tipo de perfil.";
    case "inactive-account":
    case "inactive_account":
      return "Esta conta está inativa.";
    case "app-check-required":
    case "app_check_required":
    case "app-check-invalid":
    case "app_check_invalid":
      return "Não foi possível validar a segurança desta sessão.";
    default:
      return "Não foi possível concluir a configuração da empresa.";
  }
};

export const completeAccountRegistration = async (
  input: CompleteCompanyRegistrationInput,
): Promise<CompleteCompanyRegistrationResult> => {
  const user = auth.currentUser;
  if (!user) {
    throw new AccountRegistrationError("unauthenticated", "Sessão inválida. Entre novamente.");
  }

  await user.reload();
  const freshUser = auth.currentUser;
  if (!freshUser) {
    throw new AccountRegistrationError("unauthenticated", "Sessão expirada. Entre novamente.");
  }
  if (!freshUser.emailVerified) {
    throw new AccountRegistrationError(
      "email-not-verified",
      "Confirme seu e-mail antes de continuar.",
    );
  }

  const company = input.company.trim();
  const businessType = input.businessType.trim();
  const documentNormalized = cnpjOnlyDigits(input.document);

  if (!company) {
    throw new AccountRegistrationError(
      "company-required",
      "Informe a razão social ou nome da empresa.",
    );
  }
  if (!isValidCnpj(documentNormalized)) {
    throw new AccountRegistrationError("company-document-invalid", "Informe um CNPJ válido.");
  }
  if (!businessType) {
    throw new AccountRegistrationError("business-type-required", "Selecione o tipo de negócio.");
  }
  if (!input.acceptedTerms || !input.acceptedPrivacy) {
    throw new AccountRegistrationError(
      "legal-required",
      "Aceite os termos e a política de privacidade para continuar.",
    );
  }

  const idToken = await freshUser.getIdToken(true);
  let appCheckToken: string | null = null;
  if (appCheck) {
    try {
      appCheckToken = (await getToken(appCheck, false)).token;
    } catch {
      appCheckToken = null;
    }
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 14_000);

  try {
    const response = await fetch(backendEndpoints.completeAccountRegistration, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
      },
      body: JSON.stringify({
        accountType: input.accountType,
        company,
        document: formatCnpj(documentNormalized),
        documentNormalized,
        fantasyName: input.fantasyName?.trim() || null,
        owner: input.owner?.trim() || null,
        phone: input.phone?.trim() || null,
        businessType,
        acceptedTerms: input.acceptedTerms,
        acceptedPrivacy: input.acceptedPrivacy,
      }),
    });

    const payload = readJson(await response.text());
    if (!response.ok) {
      const code = typeof payload.code === "string" ? payload.code : "registration-failed";
      throw new AccountRegistrationError(code, messageFromPayload(payload));
    }

    const responseAccountType = payload.accountType;
    if (!isAccountType(responseAccountType)) {
      throw new AccountRegistrationError(
        "invalid-server-response",
        "O servidor retornou uma resposta inválida.",
      );
    }

    return {
      accountType: responseAccountType,
      onboardingCompleted: payload.onboardingCompleted === true,
    };
  } catch (error) {
    if (error instanceof AccountRegistrationError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AccountRegistrationError("timeout", "Tempo esgotado ao preparar sua empresa.");
    }
    throw new AccountRegistrationError(
      "network-error",
      "Não foi possível concluir o cadastro. Verifique sua conexão.",
    );
  } finally {
    window.clearTimeout(timeout);
  }
};
