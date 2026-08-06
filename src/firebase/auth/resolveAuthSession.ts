// caminho: src/firebase/auth/resolveAuthSession.ts

import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import type {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
} from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";

import type { AuthSession } from "../../contexts/auth-context";
import { db } from "../firebase";

export type AuthSessionErrorCode =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_INVALID_SESSION"
  | "AUTH_EMAIL_NOT_VERIFIED"
  | "AUTH_ACCOUNT_INACTIVE"
  | "AUTH_ACCOUNT_NOT_CONFIGURED"
  | "AUTH_UNSUPPORTED_ACCOUNT"
  | "AUTH_SHARED_WORKSPACE_UNSUPPORTED"
  | "AUTH_NO_ACTIVE_WORKSPACE"
  | "AUTH_SESSION_UNAVAILABLE";

export class AuthSessionError extends Error {
  readonly code: AuthSessionErrorCode;

  constructor(
    code: AuthSessionErrorCode,
    message: string,
    options?: {
      cause?: unknown;
    },
  ) {
    super(message, options);

    this.name = "AuthSessionError";
    this.code = code;

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}

type ProfileData = Record<string, unknown>;

const BLOCKED_ACCOUNT_STATUSES = new Set<string>([
  "inactive",
  "disabled",
  "blocked",
  "suspended",
  "removed",
  "revoked",
  "deleted",
  "expired",
]);

const OPTIONAL_READ_ERROR_CODES = new Set<string>([
  "permission-denied",
]);

const isSafeDocumentId = (value: string): boolean => {
  const normalized = value.trim();

  return (
    normalized.length > 0 &&
    normalized.length <= 180 &&
    normalized !== "." &&
    normalized !== ".." &&
    !normalized.includes("/")
  );
};

const readString = (value: unknown): string => {
  return typeof value === "string"
    ? value.trim()
    : "";
};

const readLower = (value: unknown): string => {
  return readString(value).toLowerCase();
};

const firstString = (
  values: readonly unknown[],
): string => {
  for (const value of values) {
    const normalized = readString(value);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return "";
};

const toProfileData = (
  snapshot: DocumentSnapshot<DocumentData> | null,
): ProfileData | null => {
  if (!snapshot?.exists()) {
    return null;
  }

  return snapshot.data() as ProfileData;
};

const isActiveProfile = (
  data: ProfileData,
): boolean => {
  if (
    data.active === false ||
    data.isActive === false
  ) {
    return false;
  }

  const status = readLower(data.status);

  return !BLOCKED_ACCOUNT_STATUSES.has(status);
};

const hasMerchantIdentityFields = (
  data: ProfileData,
): boolean => {
  return (
    firstString([
      data.documentNormalized,
      data.document,
      data.company,
      data.companyName,
    ]).length > 0
  );
};

const canonicalMerchantCanBeOpened = (
  data: ProfileData,
): boolean => {
  if (
    !isActiveProfile(data) ||
    data.onboardingCompleted !== true
  ) {
    return false;
  }

  const accountType = readLower(
    data.accountType,
  );

  const role = readLower(
    data.role,
  );

  return (
    accountType === "merchant" ||
    role === "owner"
  );
};

const legacyMerchantCanBeOpened = (
  data: ProfileData,
): boolean => {
  if (
    !isActiveProfile(data) ||
    data.onboardingCompleted !== true
  ) {
    return false;
  }

  const accountType = readLower(
    data.accountType,
  );

  const role = readLower(
    data.role,
  );

  if (
    accountType === "supplier" ||
    role === "supplier_owner"
  ) {
    return false;
  }

  return (
    accountType === "merchant" ||
    role === "owner" ||
    (
      accountType.length === 0 &&
      hasMerchantIdentityFields(data)
    )
  );
};

const supplierCanBeOpened = (
  data: ProfileData,
): boolean => {
  if (!isActiveProfile(data)) {
    return false;
  }

  const accountType = readLower(
    data.accountType,
  );

  const role = readLower(
    data.role,
  );

  return (
    accountType.length === 0 ||
    accountType === "supplier" ||
    role === "supplier_owner"
  );
};

const profileLooksLikeSupplier = (
  data: ProfileData,
): boolean => {
  const accountType = readLower(
    data.accountType,
  );

  const role = readLower(
    data.role,
  );

  return (
    accountType === "supplier" ||
    role === "supplier_owner"
  );
};

const readDocumentSafely = async (
  reference: DocumentReference<DocumentData>,
): Promise<DocumentSnapshot<DocumentData> | null> => {
  try {
    const snapshot = await getDoc(reference);

    return snapshot.exists()
      ? snapshot
      : null;
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      OPTIONAL_READ_ERROR_CODES.has(error.code)
    ) {
      return null;
    }

    throw new AuthSessionError(
      "AUTH_SESSION_UNAVAILABLE",
      "Não foi possível consultar os dados da conta.",
      {
        cause: error,
      },
    );
  }
};

const hasActiveSharedWorkspace = async (
  currentUserUid: string,
): Promise<boolean> => {
  try {
    const reference = collection(
      db,
      "users",
      currentUserUid,
      "accessible_stocks",
    );

    const activeStocksQuery = query(
      reference,
      where("status", "==", "active"),
      limit(10),
    );

    const snapshot = await getDocs(
      activeStocksQuery,
    );

    return snapshot.docs.some((stockDocument) => {
      const data = stockDocument.data();

      const ownerUid = firstString([
        data.ownerUid,
        data.owner_uid,
        stockDocument.id,
      ]);

      if (
        !isSafeDocumentId(ownerUid) ||
        ownerUid === currentUserUid
      ) {
        return false;
      }

      const memberUid = readString(
        data.memberUid,
      );

      return (
        memberUid.length === 0 ||
        memberUid === currentUserUid
      );
    });
  } catch (error) {
    throw new AuthSessionError(
      "AUTH_SESSION_UNAVAILABLE",
      "Não foi possível consultar os estoques vinculados.",
      {
        cause: error,
      },
    );
  }
};

const resolveWorkspaceName = (
  data: ProfileData,
): string => {
  return (
    firstString([
      data.fantasyName,
      data.companyName,
      data.company,
      data.displayName,
      data.name,
    ]) || "Meu estoque"
  );
};

const resolveLoginLabel = (
  user: User,
  data: ProfileData,
): string => {
  const email = firstString([
    user.email,
    data.email,
  ]);

  if (email.length > 0) {
    return email.toLowerCase();
  }

  return (
    firstString([
      user.displayName,
      data.displayName,
      data.name,
      user.uid,
    ]) || user.uid
  );
};

const buildMerchantOwnerSession = (
  user: User,
  data: ProfileData,
): AuthSession => {
  return {
    userId: user.uid,
    workspaceId: user.uid,
    workspaceName: resolveWorkspaceName(
      data,
    ),
    login: resolveLoginLabel(
      user,
      data,
    ),
    memberRole: "owner",
    isOwnWorkspace: true,
  };
};

export const resolveAuthSession = async (
  user: User,
): Promise<AuthSession> => {
  const uid = user.uid.trim();

  if (
    !isSafeDocumentId(uid) ||
    user.isAnonymous
  ) {
    throw new AuthSessionError(
      "AUTH_INVALID_SESSION",
      "A sessão autenticada é inválida.",
    );
  }

  if (!user.emailVerified) {
    throw new AuthSessionError(
      "AUTH_EMAIL_NOT_VERIFIED",
      "O e-mail da conta ainda não foi verificado.",
    );
  }

  const [
    canonicalMerchantSnapshot,
    supplierSnapshot,
    sellerSnapshot,
    legacyUserSnapshot,
  ] = await Promise.all([
    readDocumentSafely(
      doc(
        db,
        "merchants",
        uid,
      ),
    ),
    readDocumentSafely(
      doc(
        db,
        "suppliers",
        uid,
      ),
    ),
    readDocumentSafely(
      doc(
        db,
        "sellers",
        uid,
      ),
    ),
    readDocumentSafely(
      doc(
        db,
        "users",
        uid,
      ),
    ),
  ]);

  const canonicalMerchantData =
    toProfileData(
      canonicalMerchantSnapshot,
    );

  const supplierData =
    toProfileData(
      supplierSnapshot,
    );

  const sellerData =
    toProfileData(
      sellerSnapshot,
    );

  const legacyUserData =
    toProfileData(
      legacyUserSnapshot,
    );

  // Mesma prioridade principal usada pelo Flutter:
  // 1. merchant canônico;
  // 2. supplier próprio;
  // 3. merchant legado;
  // 4. seller.
  if (
    canonicalMerchantData &&
    canonicalMerchantCanBeOpened(
      canonicalMerchantData,
    )
  ) {
    return buildMerchantOwnerSession(
      user,
      canonicalMerchantData,
    );
  }

  if (
    supplierData &&
    supplierCanBeOpened(
      supplierData,
    )
  ) {
    throw new AuthSessionError(
      "AUTH_UNSUPPORTED_ACCOUNT",
      "O Supplier Portal ainda não está disponível neste painel Web.",
    );
  }

  if (
    legacyUserData &&
    legacyMerchantCanBeOpened(
      legacyUserData,
    )
  ) {
    return buildMerchantOwnerSession(
      user,
      legacyUserData,
    );
  }

  if (
    sellerData &&
    isActiveProfile(
      sellerData,
    )
  ) {
    throw new AuthSessionError(
      "AUTH_UNSUPPORTED_ACCOUNT",
      "Contas de vendedor do fornecedor ainda não estão disponíveis neste painel Web.",
    );
  }

  const availableProfiles = [
    canonicalMerchantData,
    supplierData,
    sellerData,
    legacyUserData,
  ].filter(
    (profile): profile is ProfileData =>
      profile !== null,
  );

  const hasInactiveProfile =
    availableProfiles.some(
      (profile) =>
        !isActiveProfile(profile),
    );

  if (hasInactiveProfile) {
    throw new AuthSessionError(
      "AUTH_ACCOUNT_INACTIVE",
      "Esta conta está inativa ou bloqueada.",
    );
  }

  const hasSupplierIdentity =
    availableProfiles.some(
      (profile) =>
        profileLooksLikeSupplier(profile),
    );

  if (hasSupplierIdentity) {
    throw new AuthSessionError(
      "AUTH_UNSUPPORTED_ACCOUNT",
      "O Supplier Portal ainda não está disponível neste painel Web.",
    );
  }

  /*
   * Não abrimos automaticamente um estoque compartilhado nesta fase.
   *
   * Motivo:
   * as Callables atuais do frontend não enviam workspaceId.
   * Liberar outro ownerUid apenas pela seleção do cliente poderia fazer
   * leituras e mutações usarem contextos diferentes.
   *
   * A liberação deverá acontecer junto com:
   * - seletor de workspace;
   * - workspaceId enviado às mutações;
   * - validação obrigatória no backend.
   */
  if (
    await hasActiveSharedWorkspace(uid)
  ) {
    throw new AuthSessionError(
      "AUTH_SHARED_WORKSPACE_UNSUPPORTED",
      "O acesso Web a estoques compartilhados ainda não está habilitado.",
    );
  }

  if (
    canonicalMerchantData ||
    legacyUserData
  ) {
    throw new AuthSessionError(
      "AUTH_ACCOUNT_NOT_CONFIGURED",
      "A configuração da empresa ainda não foi concluída.",
    );
  }

  throw new AuthSessionError(
    "AUTH_NO_ACTIVE_WORKSPACE",
    "Nenhuma empresa ativa foi encontrada para esta conta.",
  );
};
