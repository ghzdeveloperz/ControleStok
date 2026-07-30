"use strict";

const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const {
  FieldValue,
  Timestamp,
  getFirestore,
} = require("firebase-admin/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

initializeApp();

const REGION = "southamerica-east1";

// Produção sempre exige App Check e proteção contra replay. O Functions
// Emulator inicia sem enforcement e permite opt-in explícito para testes.
function isLoopbackEmulatorEndpoint(value) {
  return (
    typeof value === "string" &&
    /^(?:127\.0\.0\.1|localhost|\[::1\]):(?:[1-9]\d{0,4})$/u.test(value)
  );
}

const EMULATOR_PROJECT_ID =
  process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || "";
const RUNNING_IN_FUNCTIONS_EMULATOR =
  process.env.FUNCTIONS_EMULATOR === "true" &&
  EMULATOR_PROJECT_ID.startsWith("demo-") &&
  isLoopbackEmulatorEndpoint(process.env.FIRESTORE_EMULATOR_HOST) &&
  isLoopbackEmulatorEndpoint(process.env.FIREBASE_AUTH_EMULATOR_HOST);
const ENFORCE_APP_CHECK =
  RUNNING_IN_FUNCTIONS_EMULATOR
    ? process.env.APP_CHECK_ENFORCE === "true"
    : true;

const MAX_LOGIN_ATTEMPTS = 5;
const MAX_LOGIN_ATTEMPTS_PER_IP = 100;
const MAX_LOGIN_ATTEMPTS_PER_ACCOUNT = 30;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_MUTATIONS_PER_MINUTE = 180;
const MUTATION_WINDOW_MS = 60 * 1000;
const MUTATION_LOCK_MS = 60 * 1000;
const MUTATION_RATE_LIMIT_TTL_MS = 24 * 60 * 60 * 1000;
const IDEMPOTENCY_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BACKDATE_MS = 20 * 365.25 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_DATE_MS = 24 * 60 * 60 * 1000;

const MAX_STOCK = 1_000_000_000;
const MAX_MONEY = 1_000_000_000_000;
const MAX_PRODUCT_IMAGE_BYTES = 350 * 1024;
const MAX_PRODUCT_IMAGE_DATA_URL_LENGTH =
  Math.ceil((MAX_PRODUCT_IMAGE_BYTES * 4) / 3) + 64;
const STORAGE_BUCKET = "controllstok.firebasestorage.app";
const MIN_BCRYPT_ROUNDS = 12;
const MAX_BCRYPT_ROUNDS = 14;
const MAX_BCRYPT_PASSWORD_BYTES = 72;
const CREDENTIAL_SCHEMA_VERSION = 1;
const DUMMY_CREDENTIAL_DOCUMENT_ID = "0".repeat(64);

const VALID_ROLES = new Set(["owner", "admin", "manager", "member", "viewer"]);
const MANAGEMENT_ROLES = new Set(["owner", "admin", "manager"]);
const STOCK_ROLES = new Set(["owner", "admin", "manager", "member"]);

const DUMMY_PASSWORD_HASH =
  "$2b$12$0L3ASVsraVUSYq0zo5LrFOnpb0GTLCTCB6CvOZpGBjA/UhWsJKfwC";

setGlobalOptions({
  region: REGION,
  memory: "256MiB",
  timeoutSeconds: 30,
  concurrency: 40,
  maxInstances: 10,
  minInstances: 0,
});

const db = getFirestore();
const auth = getAuth();

const BASE_CALLABLE_OPTIONS = Object.freeze({
  region: REGION,
  enforceAppCheck: ENFORCE_APP_CHECK,
  consumeAppCheckToken: ENFORCE_APP_CHECK,
  memory: "256MiB",
  timeoutSeconds: 30,
  concurrency: 40,
  maxInstances: 10,
  minInstances: 0,
});

function callable(operation, handler, overrides = {}) {
  return onCall(
    { ...BASE_CALLABLE_OPTIONS, ...overrides },
    async (request) => {
      try {
        if (ENFORCE_APP_CHECK && request.app?.alreadyConsumed === true) {
          throw new HttpsError("unauthenticated", "Requisição inválida.");
        }
        return await handler(request);
      } catch (error) {
        if (error instanceof HttpsError) {
          throw error;
        }

        logger.error("Callable failed", {
          operation,
          errorCode: safeErrorCode(error),
        });
        throw new HttpsError(
          "internal",
          "Não foi possível concluir a operação.",
        );
      }
    },
  );
}

function safeErrorCode(error) {
  if (!error || typeof error !== "object") return "unknown";
  const code = error.code;
  if (typeof code !== "string") return "unknown";
  return code.slice(0, 80);
}

function invalidArgument(message = "Dados inválidos.") {
  throw new HttpsError("invalid-argument", message);
}

function permissionDenied() {
  throw new HttpsError("permission-denied", "Acesso negado.");
}

function invalidCredentials() {
  return new HttpsError("unauthenticated", "Credenciais inválidas.");
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requireObject(value, fieldName) {
  if (!isPlainObject(value)) {
    invalidArgument(`${fieldName} inválido.`);
  }
  return value;
}

function requireExactKeys(value, requiredKeys, optionalKeys = []) {
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const keys = Object.keys(value);

  for (const requiredKey of requiredKeys) {
    if (!Object.hasOwn(value, requiredKey)) {
      invalidArgument(`Campo obrigatório ausente: ${requiredKey}.`);
    }
  }

  for (const key of keys) {
    if (!allowed.has(key)) {
      invalidArgument(`Campo não permitido: ${key}.`);
    }
  }
}

function normalizeText(value, fieldName, { min = 1, max, collapse = true } = {}) {
  if (typeof value !== "string") {
    invalidArgument(`${fieldName} deve ser texto.`);
  }

  let normalized = value.normalize("NFKC").trim();
  if (collapse) normalized = normalized.replace(/\s+/gu, " ");

  if (
    normalized.length < min ||
    normalized.length > max ||
    /[\u0000-\u001F\u007F]/u.test(normalized)
  ) {
    invalidArgument(`${fieldName} inválido.`);
  }

  return normalized;
}

function normalizeLogin(value) {
  return normalizeText(value, "login", { min: 1, max: 128 })
    .toLocaleLowerCase("pt-BR");
}

function normalizeRole(value) {
  if (typeof value !== "string") permissionDenied();
  const role = value.trim().toLowerCase();
  if (!VALID_ROLES.has(role)) permissionDenied();
  return role;
}

function normalizePathId(value, fieldName) {
  const id = normalizeText(value, fieldName, {
    min: 1,
    max: 128,
    collapse: false,
  });
  if (id === "." || id === ".." || id.includes("/")) {
    invalidArgument(`${fieldName} inválido.`);
  }
  return id;
}

function normalizeCredentialId(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/u.test(value)) {
    permissionDenied();
  }
  return value;
}

function normalizeRequestId(value) {
  const requestId = normalizeText(value, "requestId", {
    min: 8,
    max: 128,
    collapse: false,
  });
  if (!/^[A-Za-z0-9_-]+$/u.test(requestId)) {
    invalidArgument("requestId inválido.");
  }
  return requestId;
}

function normalizeName(value) {
  return normalizeText(value, "name", { min: 1, max: 120 });
}

function productNameKey(name) {
  return name.normalize("NFKC").trim().toLocaleLowerCase("pt-BR");
}

function normalizeCategory(value) {
  return normalizeText(value, "category", { min: 1, max: 80 });
}

function categoryKey(category) {
  return category.normalize("NFKC").trim().toLocaleLowerCase("pt-BR");
}

function categoryDocumentId(key) {
  return sha256(`category:${key}`).slice(0, 40);
}

function normalizeBarcode(value) {
  if (typeof value !== "string") invalidArgument("barcode deve ser texto.");
  const barcode = value.normalize("NFKC").trim();
  if (
    barcode.length > 128 ||
    /[\u0000-\u001F\u007F]/u.test(barcode) ||
    (barcode && !/^[\p{L}\p{N}._:/+-]+$/u.test(barcode))
  ) {
    invalidArgument("barcode inválido.");
  }
  return barcode;
}

function barcodeKey(barcode) {
  return barcode.normalize("NFKC").toLocaleLowerCase("pt-BR");
}

function normalizeImage(value, workspaceId) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") invalidArgument("image inválida.");

  const image = value.trim();
  if (image.length < 1) {
    invalidArgument("image inválida.");
  }
  if (
    image.startsWith("data:") &&
    image.length > MAX_PRODUCT_IMAGE_DATA_URL_LENGTH
  ) {
    invalidArgument("image inválida.");
  }

  const dataUrl = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/u.exec(
    image,
  );
  if (dataUrl) {
    const bytes = Buffer.from(dataUrl[2], "base64");
    const dimensions = readImageDimensions(dataUrl[1], bytes);
    if (
      bytes.length < 12 ||
      bytes.length > MAX_PRODUCT_IMAGE_BYTES ||
      !hasValidImageSignature(dataUrl[1], bytes) ||
      !dimensions ||
      dimensions.width < 1 ||
      dimensions.height < 1 ||
      dimensions.width > 2048 ||
      dimensions.height > 2048 ||
      dimensions.width * dimensions.height > 4_000_000
    ) {
      invalidArgument("image inválida.");
    }
    return image;
  }

  if (image.length > 2048) invalidArgument("image inválida.");

  if (
    /^\/(?:assets|images)\/[A-Za-z0-9._~!$&'()+,;=:@%/-]+$/u.test(image) &&
    !/(?:^|\/)\.{1,2}(?:\/|$)/u.test(image)
  ) {
    return image;
  }

  try {
    const parsed = new URL(image);
    if (
      parsed.protocol === "gs:" &&
      parsed.hostname === STORAGE_BUCKET &&
      isWorkspaceProductImagePath(parsed.pathname, workspaceId)
    ) {
      return image;
    }
    if (
      parsed.protocol === "https:" &&
      parsed.hostname === "firebasestorage.googleapis.com" &&
      isAllowedFirebaseStorageUrl(parsed, workspaceId)
    ) {
      return image;
    }
  } catch {
    // O erro público permanece genérico e não inclui a URL recebida.
  }

  invalidArgument("image deve usar um caminho de armazenamento autorizado.");
}

function isWorkspaceProductImagePath(pathname, workspaceId) {
  try {
    const decodedPath = decodeURIComponent(pathname).replace(/^\/+/, "");
    const prefix = `workspaces/${workspaceId}/products/`;
    return (
      decodedPath.startsWith(prefix) &&
      decodedPath.length > prefix.length &&
      !/[\u0000-\u001F\u007F]/u.test(decodedPath)
    );
  } catch {
    return false;
  }
}

function isAllowedFirebaseStorageUrl(url, workspaceId) {
  const prefix = `/v0/b/${STORAGE_BUCKET}/o/`;
  if (!url.pathname.startsWith(prefix)) return false;
  return isWorkspaceProductImagePath(
    url.pathname.slice(prefix.length),
    workspaceId,
  );
}

function hasValidImageSignature(mimeType, bytes) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mimeType === "image/webp") {
    return (
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

function isAcceptableBcryptHash(value) {
  return (
    typeof value === "string" &&
    /^\$2[aby]\$(?:0[4-9]|1[0-4])\$[./A-Za-z0-9]{53}$/u.test(value) &&
    bcryptRounds(value) >= MIN_BCRYPT_ROUNDS &&
    bcryptRounds(value) <= MAX_BCRYPT_ROUNDS
  );
}

function bcryptRounds(hash) {
  try {
    return bcrypt.getRounds(hash);
  } catch {
    return 0;
  }
}

function readImageDimensions(mimeType, bytes) {
  if (mimeType === "image/png" && bytes.length >= 24) {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }

  if (mimeType === "image/webp" && bytes.length >= 30) {
    const chunkType = bytes.subarray(12, 16).toString("ascii");
    if (chunkType === "VP8X") {
      return {
        width: 1 + bytes.readUIntLE(24, 3),
        height: 1 + bytes.readUIntLE(27, 3),
      };
    }
    if (chunkType === "VP8L" && bytes[20] === 0x2f) {
      return {
        width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]),
        height:
          1 +
          (((bytes[24] & 0x0f) << 10) |
            (bytes[23] << 2) |
            ((bytes[22] & 0xc0) >> 6)),
      };
    }
    if (
      chunkType === "VP8 " &&
      bytes[23] === 0x9d &&
      bytes[24] === 0x01 &&
      bytes[25] === 0x2a
    ) {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      };
    }
  }

  if (mimeType === "image/jpeg") {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0xda) break;
      if (offset + 2 > bytes.length) break;

      const segmentLength = bytes.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if (
        [
          0xc0,
          0xc1,
          0xc2,
          0xc3,
          0xc5,
          0xc6,
          0xc7,
          0xc9,
          0xca,
          0xcb,
          0xcd,
          0xce,
          0xcf,
        ].includes(marker) &&
        segmentLength >= 7
      ) {
        return {
          height: bytes.readUInt16BE(offset + 3),
          width: bytes.readUInt16BE(offset + 5),
        };
      }
      offset += segmentLength;
    }
  }

  return null;
}

function normalizeDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
    invalidArgument("date deve usar o formato YYYY-MM-DD.");
  }

  const year = Number(value.slice(0, 4));
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    year < 2000 ||
    year > 2100 ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value ||
    parsed.getTime() < Date.now() - MAX_BACKDATE_MS ||
    parsed.getTime() > Date.now() + MAX_FUTURE_DATE_MS
  ) {
    invalidArgument("date inválida.");
  }

  return value;
}

function currentBusinessDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeNumber(
  value,
  fieldName,
  { min = 0, max, decimals = null } = {},
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    invalidArgument(`${fieldName} deve ser numérico.`);
  }
  if (value < min || value > max) {
    invalidArgument(`${fieldName} fora do intervalo permitido.`);
  }

  if (decimals !== null) {
    const factor = 10 ** decimals;
    if (Math.abs(Math.round(value * factor) - value * factor) > 1e-7) {
      invalidArgument(`${fieldName} possui casas decimais demais.`);
    }
  }

  return value;
}

function normalizeQuantity(value, { allowZero = false } = {}) {
  return normalizeNumber(value, "quantity", {
    min: allowZero ? 0 : 0.0001,
    max: MAX_STOCK,
    decimals: 4,
  });
}

function normalizeMoney(value, fieldName) {
  return normalizeNumber(value, fieldName, {
    min: 0,
    max: MAX_MONEY,
    decimals: 2,
  });
}

function normalizeMinStock(value) {
  return normalizeNumber(value, "minStock", {
    min: 0,
    max: MAX_STOCK,
    decimals: 4,
  });
}

function storedNumber(value, fieldName, { min = 0, max } = {}) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    throw new HttpsError(
      "failed-precondition",
      `Dados persistidos inválidos: ${fieldName}.`,
    );
  }
  return value;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableSerialize(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
    .join(",")}}`;
}

function payloadHash(value) {
  return sha256(stableSerialize(value));
}

function getRequestIp(request) {
  const rawIp = request.rawRequest?.ip || request.rawRequest?.socket?.remoteAddress;
  if (RUNNING_IN_FUNCTIONS_EMULATOR && rawIp === undefined) {
    return "functions-emulator-loopback";
  }
  if (
    typeof rawIp !== "string" ||
    rawIp.length < 1 ||
    rawIp.length > 128 ||
    /[\u0000-\u0020\u007F]/u.test(rawIp)
  ) {
    throw invalidCredentials();
  }
  return rawIp;
}

function rateLimitCollection(name) {
  return db.collection("_security").doc("rateLimits").collection(name);
}

function credentialDocumentRef(uid) {
  return db
    .collection("_security")
    .doc("auth")
    .collection("credentialEntries")
    .doc(uid);
}

function credentialMatchesContext(credential, context) {
  return (
    credential.schemaVersion === CREDENTIAL_SCHEMA_VERSION &&
    credential.rotatedAfterLegacyExposure === true &&
    credential.active === true &&
    credential.uid === context.uid &&
    credential.login === context.login &&
    credential.workspaceId === context.workspaceId &&
    credential.memberRole === context.memberRole &&
    credential.credentialId === context.credentialId &&
    isAcceptableBcryptHash(credential.passwordHash)
  );
}

function loginRateLimits(ip, login) {
  return [
    {
      ref: rateLimitCollection("loginIpEntries").doc(
        sha256(`login-ip:v2:${ip}`),
      ),
      maxAttempts: MAX_LOGIN_ATTEMPTS_PER_IP,
      lockMs: LOGIN_LOCK_MS,
      successMode: "decrement",
    },
    {
      ref: rateLimitCollection("loginAccountEntries").doc(
        sha256(`login-account:v2:${login}`),
      ),
      maxAttempts: MAX_LOGIN_ATTEMPTS_PER_ACCOUNT,
      lockMs: 60 * 1000,
      successMode: "clear",
    },
    {
      ref: rateLimitCollection("loginPairEntries").doc(
        sha256(`login-pair:v2:${ip}:${login}`),
      ),
      maxAttempts: MAX_LOGIN_ATTEMPTS,
      lockMs: LOGIN_LOCK_MS,
      successMode: "clear",
    },
  ];
}

async function reserveLoginAttempt(limits) {
  const nowMs = Date.now();
  const allowed = await db.runTransaction(async (transaction) => {
    const snapshots = [];
    for (const limit of limits) {
      snapshots.push(await transaction.get(limit.ref));
    }

    const states = snapshots.map((snapshot, index) => {
      const current = snapshot.exists ? snapshot.data() : {};
      const currentLockUntil = timestampMillis(current.lockUntil);
      if (currentLockUntil > nowMs) return null;

      const storedWindowStart = timestampMillis(current.windowStartedAt);
      const completedLock =
        currentLockUntil > 0 && currentLockUntil <= nowMs;
      const windowExpired =
        completedLock ||
        storedWindowStart === 0 ||
        nowMs - storedWindowStart >= LOGIN_WINDOW_MS;
      const windowStartedAt = windowExpired ? nowMs : storedWindowStart;
      const previousAttempts = windowExpired
        ? 0
        : safeInteger(current.attemptCount);
      const nextAttempts = previousAttempts + 1;
      const shouldLock = nextAttempts > limits[index].maxAttempts;
      const lockUntil = shouldLock ? nowMs + limits[index].lockMs : 0;

      return { windowStartedAt, nextAttempts, shouldLock, lockUntil };
    });

    if (states.some((state) => state === null)) return false;

    states.forEach((state, index) => {
      transaction.set(limits[index].ref, {
        attemptCount: Math.min(
          state.nextAttempts,
          limits[index].maxAttempts,
        ),
        windowStartedAt: Timestamp.fromMillis(state.windowStartedAt),
        lockUntil: Timestamp.fromMillis(state.lockUntil),
        updatedAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(
          Math.max(
            state.windowStartedAt + LOGIN_WINDOW_MS,
            state.lockUntil,
          ) + LOGIN_RATE_LIMIT_TTL_MS,
        ),
      });
    });

    return !states.some((state) => state.shouldLock);
  });

  if (!allowed) throw invalidCredentials();
}

async function clearLoginAttempts(limits) {
  await db.runTransaction(async (transaction) => {
    const snapshots = [];
    for (const limit of limits) {
      snapshots.push(await transaction.get(limit.ref));
    }
    limits.forEach((limit, index) => {
      const snapshot = snapshots[index];
      if (!snapshot.exists) return;
      if (limit.successMode === "clear") {
        transaction.delete(limit.ref);
        return;
      }
      const attempts = safeInteger(snapshot.data().attemptCount);
      if (attempts <= 1) {
        transaction.delete(limit.ref);
      } else {
        transaction.update(limit.ref, {
          attemptCount: attempts - 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });
  });
}

function timestampMillis(value) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

function safeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

async function reserveMutationQuota(context) {
  const key = sha256(
    `mutation-actor:v1:${context.workspaceId}:${context.uid}`,
  );
  const ref = rateLimitCollection("mutationRateEntries").doc(key);
  const nowMs = Date.now();
  const allowed = await db.runTransaction(async (transaction) => {
    await revalidateWorkspaceContext(
      transaction,
      context,
      VALID_ROLES,
    );
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists ? snapshot.data() : {};
    const currentLockUntil = timestampMillis(current.lockUntil);
    if (currentLockUntil > nowMs) return false;

    const storedWindowStart = timestampMillis(current.windowStartedAt);
    const windowExpired =
      storedWindowStart === 0 ||
      nowMs - storedWindowStart >= MUTATION_WINDOW_MS;
    const windowStartedAt = windowExpired ? nowMs : storedWindowStart;
    const previousAttempts = windowExpired
      ? 0
      : safeInteger(current.attemptCount);
    const nextAttempts = previousAttempts + 1;
    const shouldLock = nextAttempts > MAX_MUTATIONS_PER_MINUTE;
    const lockUntil = shouldLock ? nowMs + MUTATION_LOCK_MS : 0;

    transaction.set(ref, {
      attemptCount: Math.min(nextAttempts, MAX_MUTATIONS_PER_MINUTE),
      windowStartedAt: Timestamp.fromMillis(windowStartedAt),
      lockUntil: Timestamp.fromMillis(lockUntil),
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(
        Math.max(windowStartedAt + MUTATION_WINDOW_MS, lockUntil) +
          MUTATION_RATE_LIMIT_TTL_MS,
      ),
    });
    return !shouldLock;
  });

  if (!allowed) {
    throw new HttpsError(
      "resource-exhausted",
      "Muitas operações. Tente novamente em instantes.",
    );
  }
}

async function requireProvisionedAuthUser(uid, expectedClaims) {
  let user;
  try {
    user = await auth.getUser(uid);
  } catch (error) {
    if (error?.code === "auth/user-not-found") throw invalidCredentials();
    throw error;
  }

  const claims = user.customClaims || {};
  const claimKeys = Object.keys(claims).sort();
  if (
    user.disabled ||
    user.email !== undefined ||
    user.phoneNumber !== undefined ||
    user.providerData.length !== 0 ||
    (user.multiFactor?.enrolledFactors?.length ?? 0) !== 0 ||
    claimKeys.length !== 4 ||
    claimKeys[0] !== "credentialId" ||
    claimKeys[1] !== "login" ||
    claimKeys[2] !== "memberRole" ||
    claimKeys[3] !== "workspaceId" ||
    claims.workspaceId !== expectedClaims.workspaceId ||
    claims.login !== expectedClaims.login ||
    claims.memberRole !== expectedClaims.memberRole ||
    claims.credentialId !== expectedClaims.credentialId
  ) {
    throw invalidCredentials();
  }

  return user;
}

async function requireWorkspaceContext(request, allowedRoles) {
  const uid = request.auth?.uid;
  const firebaseClaims = request.auth?.token?.firebase;
  if (typeof uid !== "string" || uid.length < 1 || uid.length > 128) {
    throw new HttpsError("unauthenticated", "Autenticação necessária.");
  }
  if (
    !isPlainObject(firebaseClaims) ||
    firebaseClaims.sign_in_provider !== "custom"
  ) {
    permissionDenied();
  }

  let workspaceId;
  let login;
  let memberRole;
  let credentialId;
  try {
    workspaceId = normalizePathId(request.auth.token.workspaceId, "workspaceId");
    login = normalizeLogin(request.auth.token.login);
    memberRole = normalizeRole(request.auth.token.memberRole);
    credentialId = normalizeCredentialId(request.auth.token.credentialId);
  } catch {
    permissionDenied();
  }

  if (!allowedRoles.has(memberRole)) permissionDenied();

  const rootSnapshot = await db.collection("users").doc(uid).get();
  if (!rootSnapshot.exists) permissionDenied();

  const root = rootSnapshot.data();
  if (root.active !== true || Object.hasOwn(root, "passwordHash")) {
    permissionDenied();
  }

  let rootWorkspaceId;
  let rootLogin;
  let rootRole;
  let rootCredentialId;
  try {
    rootWorkspaceId = normalizePathId(root.workspaceId, "workspaceId");
    rootLogin = normalizeLogin(root.login);
    rootRole = normalizeRole(root.memberRole);
    rootCredentialId = normalizeCredentialId(root.credentialId);
  } catch {
    permissionDenied();
  }

  if (
    request.auth.token.workspaceId !== workspaceId ||
    request.auth.token.login !== login ||
    request.auth.token.memberRole !== memberRole ||
    request.auth.token.credentialId !== credentialId ||
    root.workspaceId !== rootWorkspaceId ||
    root.login !== rootLogin ||
    root.memberRole !== rootRole ||
    root.credentialId !== rootCredentialId ||
    rootWorkspaceId !== workspaceId ||
    rootLogin !== login ||
    rootRole !== memberRole ||
    rootCredentialId !== credentialId
  ) {
    permissionDenied();
  }

  const context = Object.freeze({
    uid,
    workspaceId,
    login,
    memberRole,
    credentialId,
  });
  const credentialSnapshot = await credentialDocumentRef(uid).get();
  if (
    !credentialSnapshot.exists ||
    !credentialMatchesContext(credentialSnapshot.data(), context)
  ) {
    permissionDenied();
  }

  return context;
}

async function revalidateWorkspaceContext(
  transaction,
  context,
  allowedRoles,
) {
  if (!allowedRoles.has(context.memberRole)) permissionDenied();

  const rootSnapshot = await transaction.get(
    db.collection("users").doc(context.uid),
  );
  if (!rootSnapshot.exists) permissionDenied();

  const credentialSnapshot = await transaction.get(
    credentialDocumentRef(context.uid),
  );
  if (
    !credentialSnapshot.exists ||
    !credentialMatchesContext(credentialSnapshot.data(), context)
  ) {
    permissionDenied();
  }

  const migrationSnapshot = await transaction.get(
    db
      .collection("users")
      .doc(context.workspaceId)
      .collection("_security")
      .doc("migration"),
  );
  const migration = migrationSnapshot.exists ? migrationSnapshot.data() : {};
  if (
    migration.completed !== true ||
    migration.schemaVersion !== 2 ||
    migration.inventoryBaselineAccepted !== true
  ) {
    throw new HttpsError(
      "failed-precondition",
      "Migração de segurança pendente para este workspace.",
    );
  }

  const root = rootSnapshot.data();
  let rootWorkspaceId;
  let rootLogin;
  let rootRole;
  let rootCredentialId;
  try {
    rootWorkspaceId = normalizePathId(root.workspaceId, "workspaceId");
    rootLogin = normalizeLogin(root.login);
    rootRole = normalizeRole(root.memberRole);
    rootCredentialId = normalizeCredentialId(root.credentialId);
  } catch {
    permissionDenied();
  }

  if (
    root.active !== true ||
    Object.hasOwn(root, "passwordHash") ||
    root.workspaceId !== rootWorkspaceId ||
    root.login !== rootLogin ||
    root.memberRole !== rootRole ||
    root.credentialId !== rootCredentialId ||
    rootWorkspaceId !== context.workspaceId ||
    rootLogin !== context.login ||
    rootRole !== context.memberRole ||
    rootCredentialId !== context.credentialId
  ) {
    permissionDenied();
  }
}

function idempotencyRef(workspaceId, operation, requestId, actorUid) {
  const id = sha256(
    `idempotency:v2:${workspaceId}:${actorUid}:${operation}:${requestId}`,
  );
  return db
    .collection("_security")
    .doc("idempotency")
    .collection("idempotencyEntries")
    .doc(id);
}

async function readIdempotency(transaction, ref, requestHash, actorUid) {
  const snapshot = await transaction.get(ref);
  if (!snapshot.exists) return null;

  const record = snapshot.data();
  if (
    record.actorUid !== actorUid ||
    record.requestHash !== requestHash ||
    !isPlainObject(record.result)
  ) {
    throw new HttpsError(
      "already-exists",
      "requestId já utilizado com outro conteúdo.",
    );
  }

  return record.result;
}

function writeIdempotency(
  transaction,
  ref,
  { workspaceId, operation, requestId, requestHash, actorUid, result },
) {
  transaction.create(ref, {
    workspaceId,
    operation,
    requestId,
    requestHash,
    actorUid,
    result,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + IDEMPOTENCY_TTL_MS),
  });
}

function workspaceCollections(workspaceId) {
  const workspaceRoot = db.collection("users").doc(workspaceId);
  return {
    root: workspaceRoot,
    products: workspaceRoot.collection("products"),
    categories: workspaceRoot.collection("categories"),
    movements: workspaceRoot.collection("movements"),
  };
}

function productReservationRef(workspaceId, kind, normalizedValue) {
  return db
    .collection("users")
    .doc(workspaceId)
    .collection("_security")
    .doc("uniqueness")
    .collection(kind)
    .doc(sha256(`${kind}:v1:${normalizedValue}`));
}

function productNameReservationRef(workspaceId, nameKey) {
  return productReservationRef(workspaceId, "productNameLocks", nameKey);
}

function productBarcodeReservationRef(workspaceId, barcode) {
  return productReservationRef(workspaceId, "productBarcodeLocks", barcode);
}

function assertReservationAvailable(snapshot, productId, message) {
  if (!snapshot.exists) return;
  const ownerProductId = snapshot.data().productId;
  if (ownerProductId !== productId) {
    throw new HttpsError("already-exists", message);
  }
}

function writeProductReservation(
  transaction,
  ref,
  { productId, normalizedValue, actorUid },
) {
  transaction.set(ref, {
    productId,
    normalizedValue,
    updatedBy: actorUid,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

function releaseProductReservation(transaction, snapshot, productId) {
  if (snapshot?.exists && snapshot.data().productId === productId) {
    transaction.delete(snapshot.ref);
  }
}

function hasActiveDocumentOtherThan(snapshot, documentId) {
  return snapshot.docs.some(
    (document) =>
      document.id !== documentId && document.data().archived !== true,
  );
}

function hasActiveDocument(snapshot) {
  return snapshot.docs.some((document) => document.data().archived !== true);
}

function parseCreateProduct(data, workspaceId) {
  const payload = requireObject(data, "payload");
  requireExactKeys(
    payload,
    [
      "name",
      "category",
      "quantity",
      "cost",
      "unitPrice",
      "minStock",
      "barcode",
      "date",
      "requestId",
    ],
    ["image"],
  );

  const name = normalizeName(payload.name);
  const category = normalizeCategory(payload.category);
  const barcode = normalizeBarcode(payload.barcode);
  if (!barcode) invalidArgument("barcode é obrigatório.");
  return {
    name,
    nameKey: productNameKey(name),
    category,
    categoryKey: categoryKey(category),
    quantity: normalizeQuantity(payload.quantity, { allowZero: true }),
    cost: normalizeMoney(payload.cost, "cost"),
    unitPrice: normalizeMoney(payload.unitPrice, "unitPrice"),
    image: normalizeImage(payload.image, workspaceId),
    minStock: normalizeMinStock(payload.minStock),
    barcode,
    barcodeKey: barcodeKey(barcode),
    date: normalizeDate(payload.date),
    requestId: normalizeRequestId(payload.requestId),
  };
}

function parseAdjustStock(data) {
  const payload = requireObject(data, "payload");
  requireExactKeys(
    payload,
    ["productId", "type", "quantity", "date", "requestId"],
    ["cost", "unitPrice"],
  );

  if (payload.type !== "add" && payload.type !== "remove") {
    invalidArgument("type deve ser add ou remove.");
  }

  return {
    productId: normalizePathId(payload.productId, "productId"),
    type: payload.type,
    quantity: normalizeQuantity(payload.quantity),
    date: normalizeDate(payload.date),
    cost: Object.hasOwn(payload, "cost")
      ? normalizeMoney(payload.cost, "cost")
      : null,
    unitPrice: Object.hasOwn(payload, "unitPrice")
      ? normalizeMoney(payload.unitPrice, "unitPrice")
      : null,
    requestId: normalizeRequestId(payload.requestId),
  };
}

function parseUpdateProduct(data) {
  const payload = requireObject(data, "payload");
  requireExactKeys(payload, ["productId", "changes", "requestId"]);
  const changes = requireObject(payload.changes, "changes");
  requireExactKeys(changes, [], ["name", "category", "minStock", "barcode"]);

  if (Object.keys(changes).length === 0) {
    invalidArgument("changes não pode ser vazio.");
  }

  const normalizedChanges = {};
  if (Object.hasOwn(changes, "name")) {
    const name = normalizeName(changes.name);
    normalizedChanges.name = name;
    normalizedChanges.nameKey = productNameKey(name);
  }
  if (Object.hasOwn(changes, "category")) {
    const category = normalizeCategory(changes.category);
    normalizedChanges.category = category;
    normalizedChanges.categoryKey = categoryKey(category);
  }
  if (Object.hasOwn(changes, "minStock")) {
    normalizedChanges.minStock = normalizeMinStock(changes.minStock);
  }
  if (Object.hasOwn(changes, "barcode")) {
    const barcode = normalizeBarcode(changes.barcode);
    if (!barcode) invalidArgument("barcode é obrigatório.");
    normalizedChanges.barcode = barcode;
    normalizedChanges.barcodeKey = barcodeKey(barcode);
  }

  return {
    productId: normalizePathId(payload.productId, "productId"),
    changes: normalizedChanges,
    requestId: normalizeRequestId(payload.requestId),
  };
}

function parseProductRequest(data) {
  const payload = requireObject(data, "payload");
  requireExactKeys(payload, ["productId", "requestId"]);
  return {
    productId: normalizePathId(payload.productId, "productId"),
    requestId: normalizeRequestId(payload.requestId),
  };
}

function parseCategoryRequest(data) {
  const payload = requireObject(data, "payload");
  requireExactKeys(payload, ["name", "requestId"]);
  const name = normalizeCategory(payload.name);
  return {
    name,
    nameKey: categoryKey(name),
    requestId: normalizeRequestId(payload.requestId),
  };
}

exports.loginWithPassword = callable(
  "loginWithPassword",
  async (request) => {
    let payload;
    let login;
    let password;
    try {
      payload = requireObject(request.data, "payload");
      requireExactKeys(payload, ["login", "password"]);
      login = normalizeLogin(payload.login);
      if (
        typeof payload.password !== "string" ||
        payload.password.length < 1 ||
        payload.password.length > 128 ||
        Buffer.byteLength(payload.password, "utf8") > MAX_BCRYPT_PASSWORD_BYTES
      ) {
        throw invalidCredentials();
      }
      password = payload.password;
    } catch {
      throw invalidCredentials();
    }

    const rateLimits = loginRateLimits(getRequestIp(request), login);
    await reserveLoginAttempt(rateLimits);

    const usersSnapshot = await db
      .collection("users")
      .where("login", "==", login)
      .limit(2)
      .get();

    const accountDocument =
      usersSnapshot.size === 1 ? usersSnapshot.docs[0] : null;
    const account = accountDocument?.data() || {};
    let uid = null;
    let storedLogin = null;
    let workspaceId = null;
    let memberRole = null;
    let credentialId = null;
    try {
      uid = normalizePathId(accountDocument?.id, "uid");
      storedLogin = normalizeLogin(account.login);
      workspaceId = normalizePathId(account.workspaceId, "workspaceId");
      memberRole = normalizeRole(account.memberRole);
      credentialId = normalizeCredentialId(account.credentialId);
    } catch {
      // A comparação dummy abaixo mantém o caminho de falha uniforme.
    }

    const credentialSnapshot = await credentialDocumentRef(
      uid || DUMMY_CREDENTIAL_DOCUMENT_ID,
    ).get();
    const credential = credentialSnapshot.exists
      ? credentialSnapshot.data()
      : {};
    const passwordHash = isAcceptableBcryptHash(credential.passwordHash)
      ? credential.passwordHash
      : DUMMY_PASSWORD_HASH;

    let passwordMatches;
    try {
      passwordMatches = await bcrypt.compare(password, passwordHash);
    } catch {
      passwordMatches = false;
    }

    if (
      !passwordMatches ||
      !uid ||
      storedLogin !== login ||
      account.login !== login ||
      account.active !== true ||
      account.workspaceId !== workspaceId ||
      account.memberRole !== memberRole ||
      account.credentialId !== credentialId ||
      Object.hasOwn(account, "passwordHash") ||
      !credentialSnapshot.exists ||
      credential.schemaVersion !== CREDENTIAL_SCHEMA_VERSION ||
      credential.rotatedAfterLegacyExposure !== true ||
      credential.active !== true ||
      credential.uid !== uid ||
      credential.login !== login ||
      credential.workspaceId !== workspaceId ||
      credential.memberRole !== memberRole ||
      credential.credentialId !== credentialId ||
      credential.passwordHash !== passwordHash
    ) {
      throw invalidCredentials();
    }

    await db.runTransaction(async (transaction) => {
      const currentSnapshot = await transaction.get(accountDocument.ref);
      const currentCredentialSnapshot = await transaction.get(
        credentialDocumentRef(uid),
      );
      const current = currentSnapshot.exists ? currentSnapshot.data() : {};
      const currentCredential = currentCredentialSnapshot.exists
        ? currentCredentialSnapshot.data()
        : {};

      if (
        !currentSnapshot.exists ||
        !currentCredentialSnapshot.exists ||
        current.active !== true ||
        current.login !== login ||
        current.workspaceId !== workspaceId ||
        current.memberRole !== memberRole ||
        current.credentialId !== credentialId ||
        Object.hasOwn(current, "passwordHash") ||
        currentCredential.schemaVersion !== CREDENTIAL_SCHEMA_VERSION ||
        currentCredential.rotatedAfterLegacyExposure !== true ||
        currentCredential.active !== true ||
        currentCredential.uid !== uid ||
        currentCredential.login !== login ||
        currentCredential.workspaceId !== workspaceId ||
        currentCredential.memberRole !== memberRole ||
        currentCredential.credentialId !== credentialId ||
        currentCredential.passwordHash !== passwordHash
      ) {
        throw invalidCredentials();
      }
    });

    const claims = { workspaceId, memberRole, login, credentialId };
    await requireProvisionedAuthUser(uid, claims);
    const token = await auth.createCustomToken(uid, claims);
    try {
      await clearLoginAttempts(rateLimits);
    } catch (error) {
      logger.warn("Could not clear login rate limit after success", {
        errorCode: safeErrorCode(error),
      });
    }

    return { token, workspaceId, login, memberRole };
  },
  {
    concurrency: 5,
    maxInstances: 5,
    timeoutSeconds: 20,
  },
);

exports.createProduct = callable("createProduct", async (request) => {
  const context = await requireWorkspaceContext(request, MANAGEMENT_ROLES);
  await reserveMutationQuota(context);
  const input = parseCreateProduct(request.data, context.workspaceId);
  const collections = workspaceCollections(context.workspaceId);
  const productRef = collections.products.doc();
  const movementRef = collections.movements.doc();
  const nameReservationRef = productNameReservationRef(
    context.workspaceId,
    input.nameKey,
  );
  const barcodeReservationRef = productBarcodeReservationRef(
    context.workspaceId,
    input.barcodeKey,
  );
  const categoriesByKey = collections.categories
    .where("nameKey", "==", input.categoryKey)
    .where("active", "==", true)
    .limit(2);
  const productsByNameKey = collections.products
    .where("nameKey", "==", input.nameKey)
    .where("archived", "==", false)
    .limit(2);
  const productsByBarcodeKey = collections.products
    .where("barcodeKey", "==", input.barcodeKey)
    .where("archived", "==", false)
    .limit(2);
  const operation = "createProduct";
  const requestHash = payloadHash(input);
  const idemRef = idempotencyRef(
    context.workspaceId,
    operation,
    input.requestId,
    context.uid,
  );

  return db.runTransaction(async (transaction) => {
    await revalidateWorkspaceContext(
      transaction,
      context,
      MANAGEMENT_ROLES,
    );
    const previousResult = await readIdempotency(
      transaction,
      idemRef,
      requestHash,
      context.uid,
    );
    if (previousResult) return previousResult;

    const categoriesByKeySnapshot = await transaction.get(categoriesByKey);
    const productsByNameKeySnapshot = await transaction.get(productsByNameKey);
    const productsByBarcodeKeySnapshot = await transaction.get(
      productsByBarcodeKey,
    );
    const nameReservationSnapshot = await transaction.get(nameReservationRef);
    const barcodeReservationSnapshot = await transaction.get(
      barcodeReservationRef,
    );

    if (categoriesByKeySnapshot.size !== 1) {
      throw new HttpsError("failed-precondition", "Categoria inexistente.");
    }
    if (hasActiveDocument(productsByNameKeySnapshot)) {
      throw new HttpsError("already-exists", "Nome de produto já utilizado.");
    }
    if (hasActiveDocument(productsByBarcodeKeySnapshot)) {
      throw new HttpsError("already-exists", "Código de barras já utilizado.");
    }
    assertReservationAvailable(
      nameReservationSnapshot,
      productRef.id,
      "Nome de produto já utilizado.",
    );
    assertReservationAvailable(
      barcodeReservationSnapshot,
      productRef.id,
      "Código de barras já utilizado.",
    );

    const result = { productId: productRef.id };
    transaction.create(productRef, {
      name: input.name,
      nameKey: input.nameKey,
      category: input.category,
      categoryKey: input.categoryKey,
      quantity: input.quantity,
      cost: input.cost,
      unitPrice: input.unitPrice,
      price: input.cost,
      image: input.image,
      minStock: input.minStock,
      barcode: input.barcode,
      barcodeKey: input.barcodeKey,
      archived: false,
      createdBy: context.uid,
      updatedBy: context.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (input.quantity > 0) {
      transaction.create(movementRef, {
        productId: productRef.id,
        productName: input.name,
        quantity: input.quantity,
        cost: input.cost,
        unitPrice: input.unitPrice,
        type: "add",
        date: input.date,
        requestId: input.requestId,
        actorUid: context.uid,
        timestamp: FieldValue.serverTimestamp(),
      });
    }
    writeProductReservation(transaction, nameReservationRef, {
      productId: productRef.id,
      normalizedValue: input.nameKey,
      actorUid: context.uid,
    });
    writeProductReservation(transaction, barcodeReservationRef, {
      productId: productRef.id,
      normalizedValue: input.barcodeKey,
      actorUid: context.uid,
    });
    writeIdempotency(transaction, idemRef, {
      workspaceId: context.workspaceId,
      operation,
      requestId: input.requestId,
      requestHash,
      actorUid: context.uid,
      result,
    });
    return result;
  });
});

exports.adjustStock = callable("adjustStock", async (request) => {
  const context = await requireWorkspaceContext(request, STOCK_ROLES);
  await reserveMutationQuota(context);
  const input = parseAdjustStock(request.data);
  const canManageFinancials = MANAGEMENT_ROLES.has(context.memberRole);
  const collections = workspaceCollections(context.workspaceId);
  const productRef = collections.products.doc(input.productId);
  const movementRef = collections.movements.doc();
  const operation = "adjustStock";
  const requestHash = payloadHash(input);
  const idemRef = idempotencyRef(
    context.workspaceId,
    operation,
    input.requestId,
    context.uid,
  );

  return db.runTransaction(async (transaction) => {
    await revalidateWorkspaceContext(
      transaction,
      context,
      STOCK_ROLES,
    );
    const previousResult = await readIdempotency(
      transaction,
      idemRef,
      requestHash,
      context.uid,
    );
    if (previousResult) return previousResult;

    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists || productSnapshot.data().archived === true) {
      throw new HttpsError("not-found", "Produto não encontrado.");
    }

    const product = productSnapshot.data();
    const currentQuantity = storedNumber(product.quantity, "quantity", {
      min: 0,
      max: MAX_STOCK,
    });
    const currentCost = storedNumber(
      product.cost ?? product.price ?? product.unitPrice ?? 0,
      "cost",
      {
        min: 0,
        max: MAX_MONEY,
      },
    );
    const currentUnitPrice = storedNumber(
      product.unitPrice ?? product.price ?? 0,
      "unitPrice",
      { min: 0, max: MAX_MONEY },
    );

    const newQuantity =
      input.type === "add"
        ? currentQuantity + input.quantity
        : currentQuantity - input.quantity;
    if (newQuantity < 0 || newQuantity > MAX_STOCK) {
      throw new HttpsError(
        "failed-precondition",
        input.type === "remove"
          ? "Estoque insuficiente."
          : "Limite de estoque excedido.",
      );
    }

    const normalizedNewQuantity = Math.round(newQuantity * 10_000) / 10_000;
    let movementCost = currentCost;
    let movementUnitPrice = currentUnitPrice;
    const updates = {
      quantity: normalizedNewQuantity,
      archived: false,
      updatedBy: context.uid,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (input.type === "add" && canManageFinancials) {
      const authorizedLotCost = input.unitPrice ?? currentCost;
      const calculatedAverage =
        normalizedNewQuantity === 0
          ? authorizedLotCost
          : (currentQuantity * currentCost +
              input.quantity * authorizedLotCost) /
            normalizedNewQuantity;
      const newAverageCost = Math.round(calculatedAverage * 100) / 100;
      if (!Number.isFinite(newAverageCost) || newAverageCost > MAX_MONEY) {
        throw new HttpsError(
          "failed-precondition",
          "Custo médio fora do limite permitido.",
        );
      }

      updates.cost = newAverageCost;
      updates.price = newAverageCost;
      updates.unitPrice = authorizedLotCost;
      movementCost = newAverageCost;
      movementUnitPrice = authorizedLotCost;
    } else if (input.type === "add") {
      movementUnitPrice = currentUnitPrice;
    }

    const result = { quantity: normalizedNewQuantity };
    transaction.update(productRef, updates);
    transaction.create(movementRef, {
      productId: productRef.id,
      productName: normalizeName(product.name),
      quantity: input.quantity,
      cost: movementCost,
      unitPrice: movementUnitPrice,
      type: input.type,
      date: input.date,
      requestId: input.requestId,
      actorUid: context.uid,
      timestamp: FieldValue.serverTimestamp(),
    });
    writeIdempotency(transaction, idemRef, {
      workspaceId: context.workspaceId,
      operation,
      requestId: input.requestId,
      requestHash,
      actorUid: context.uid,
      result,
    });
    return result;
  });
});

exports.updateProduct = callable("updateProduct", async (request) => {
  const context = await requireWorkspaceContext(request, MANAGEMENT_ROLES);
  await reserveMutationQuota(context);
  const input = parseUpdateProduct(request.data);
  const collections = workspaceCollections(context.workspaceId);
  const productRef = collections.products.doc(input.productId);
  const operation = "updateProduct";
  const requestHash = payloadHash(input);
  const idemRef = idempotencyRef(
    context.workspaceId,
    operation,
    input.requestId,
    context.uid,
  );
  const categoriesByKey = input.changes.categoryKey
    ? collections.categories.where(
        "nameKey",
        "==",
        input.changes.categoryKey,
      ).where("active", "==", true).limit(2)
    : null;

  return db.runTransaction(async (transaction) => {
    await revalidateWorkspaceContext(
      transaction,
      context,
      MANAGEMENT_ROLES,
    );
    const previousResult = await readIdempotency(
      transaction,
      idemRef,
      requestHash,
      context.uid,
    );
    if (previousResult) return previousResult;

    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists || productSnapshot.data().archived === true) {
      throw new HttpsError("not-found", "Produto não encontrado.");
    }

    const product = productSnapshot.data();
    const currentName = normalizeName(product.name);
    const currentNameKey = productNameKey(currentName);
    const currentCategory = normalizeCategory(product.category);
    const currentBarcode = normalizeBarcode(product.barcode ?? "");
    const currentBarcodeKey = currentBarcode
      ? barcodeKey(currentBarcode)
      : null;
    const targetName = input.changes.name ?? currentName;
    const targetNameKey = productNameKey(targetName);
    const targetCategory = input.changes.category ?? currentCategory;
    const targetCategoryKey = categoryKey(targetCategory);
    const targetBarcode = input.changes.barcode ?? currentBarcode;
    const targetBarcodeKey = targetBarcode ? barcodeKey(targetBarcode) : null;

    const productsByNameKey = collections.products
      .where("nameKey", "==", targetNameKey)
      .where("archived", "==", false)
      .limit(2);
    const productsByBarcodeKey = targetBarcodeKey
      ? collections.products
          .where("barcodeKey", "==", targetBarcodeKey)
          .where("archived", "==", false)
          .limit(2)
      : null;
    const targetNameReservationRef = productNameReservationRef(
      context.workspaceId,
      targetNameKey,
    );
    const currentNameReservationRef = productNameReservationRef(
      context.workspaceId,
      currentNameKey,
    );
    const targetBarcodeReservationRef = targetBarcodeKey
      ? productBarcodeReservationRef(context.workspaceId, targetBarcodeKey)
      : null;
    const currentBarcodeReservationRef = currentBarcodeKey
      ? productBarcodeReservationRef(context.workspaceId, currentBarcodeKey)
      : null;

    const categoriesByKeySnapshot = categoriesByKey
      ? await transaction.get(categoriesByKey)
      : null;
    const productsByNameKeySnapshot = await transaction.get(productsByNameKey);
    const productsByBarcodeKeySnapshot = productsByBarcodeKey
      ? await transaction.get(productsByBarcodeKey)
      : null;
    const targetNameReservationSnapshot = await transaction.get(
      targetNameReservationRef,
    );
    const currentNameReservationSnapshot =
      currentNameReservationRef.path === targetNameReservationRef.path
        ? targetNameReservationSnapshot
        : await transaction.get(currentNameReservationRef);
    const targetBarcodeReservationSnapshot = targetBarcodeReservationRef
      ? await transaction.get(targetBarcodeReservationRef)
      : null;
    const currentBarcodeReservationSnapshot = currentBarcodeReservationRef
      ? targetBarcodeReservationRef &&
        currentBarcodeReservationRef.path === targetBarcodeReservationRef.path
        ? targetBarcodeReservationSnapshot
        : await transaction.get(currentBarcodeReservationRef)
      : null;

    if (
      input.changes.category &&
      categoriesByKeySnapshot?.size !== 1
    ) {
      throw new HttpsError("failed-precondition", "Categoria inexistente.");
    }
    if (hasActiveDocumentOtherThan(productsByNameKeySnapshot, input.productId)) {
      throw new HttpsError("already-exists", "Nome de produto já utilizado.");
    }
    if (
      productsByBarcodeKeySnapshot &&
      hasActiveDocumentOtherThan(
        productsByBarcodeKeySnapshot,
        input.productId,
      )
    ) {
      throw new HttpsError("already-exists", "Código de barras já utilizado.");
    }
    assertReservationAvailable(
      targetNameReservationSnapshot,
      input.productId,
      "Nome de produto já utilizado.",
    );
    if (targetBarcodeReservationSnapshot) {
      assertReservationAvailable(
        targetBarcodeReservationSnapshot,
        input.productId,
        "Código de barras já utilizado.",
      );
    }

    transaction.update(productRef, {
      ...input.changes,
      nameKey: targetNameKey,
      categoryKey: targetCategoryKey,
      ...(targetBarcodeKey ? { barcodeKey: targetBarcodeKey } : {}),
      archived: false,
      updatedBy: context.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    writeProductReservation(transaction, targetNameReservationRef, {
      productId: input.productId,
      normalizedValue: targetNameKey,
      actorUid: context.uid,
    });
    if (targetBarcodeReservationRef) {
      writeProductReservation(transaction, targetBarcodeReservationRef, {
        productId: input.productId,
        normalizedValue: targetBarcodeKey,
        actorUid: context.uid,
      });
    }
    if (currentNameReservationRef.path !== targetNameReservationRef.path) {
      releaseProductReservation(
        transaction,
        currentNameReservationSnapshot,
        input.productId,
      );
    }
    if (
      currentBarcodeReservationRef &&
      (!targetBarcodeReservationRef ||
        currentBarcodeReservationRef.path !== targetBarcodeReservationRef.path)
    ) {
      releaseProductReservation(
        transaction,
        currentBarcodeReservationSnapshot,
        input.productId,
      );
    }

    const result = { success: true };
    writeIdempotency(transaction, idemRef, {
      workspaceId: context.workspaceId,
      operation,
      requestId: input.requestId,
      requestHash,
      actorUid: context.uid,
      result,
    });
    return result;
  });
});

exports.archiveProduct = callable("archiveProduct", async (request) => {
  const context = await requireWorkspaceContext(request, MANAGEMENT_ROLES);
  await reserveMutationQuota(context);
  const input = parseProductRequest(request.data);
  const collections = workspaceCollections(context.workspaceId);
  const productRef = collections.products.doc(input.productId);
  const movementRef = collections.movements.doc();
  const archiveDate = currentBusinessDate();
  const operation = "archiveProduct";
  const requestHash = payloadHash(input);
  const idemRef = idempotencyRef(
    context.workspaceId,
    operation,
    input.requestId,
    context.uid,
  );

  return db.runTransaction(async (transaction) => {
    await revalidateWorkspaceContext(
      transaction,
      context,
      MANAGEMENT_ROLES,
    );
    const previousResult = await readIdempotency(
      transaction,
      idemRef,
      requestHash,
      context.uid,
    );
    if (previousResult) return previousResult;

    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists) {
      throw new HttpsError("not-found", "Produto não encontrado.");
    }

    const product = productSnapshot.data();
    const productName = normalizeName(product.name);
    const currentQuantity = storedNumber(product.quantity, "quantity", {
      min: 0,
      max: MAX_STOCK,
    });
    const currentCost = storedNumber(
      product.cost ?? product.price ?? product.unitPrice ?? 0,
      "cost",
      { min: 0, max: MAX_MONEY },
    );
    const currentUnitPrice = storedNumber(
      product.unitPrice ?? product.price ?? 0,
      "unitPrice",
      { min: 0, max: MAX_MONEY },
    );
    if (product.archived === true && currentQuantity !== 0) {
      throw new HttpsError(
        "failed-precondition",
        "Produto arquivado possui saldo inconsistente.",
      );
    }
    let nameReservationRef;
    let barcodeReservationRef;
    try {
      nameReservationRef = productNameReservationRef(
        context.workspaceId,
        productNameKey(productName),
      );
    } catch {
      nameReservationRef = null;
    }
    try {
      const barcode = normalizeBarcode(product.barcode ?? "");
      barcodeReservationRef = barcode
        ? productBarcodeReservationRef(
            context.workspaceId,
            barcodeKey(barcode),
          )
        : null;
    } catch {
      barcodeReservationRef = null;
    }
    const nameReservationSnapshot = nameReservationRef
      ? await transaction.get(nameReservationRef)
      : null;
    const barcodeReservationSnapshot = barcodeReservationRef
      ? await transaction.get(barcodeReservationRef)
      : null;

    const result = { success: true };
    if (productSnapshot.data().archived !== true) {
      transaction.update(productRef, {
        quantity: 0,
        archived: true,
        archivedBy: context.uid,
        archivedAt: FieldValue.serverTimestamp(),
        updatedBy: context.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (currentQuantity > 0) {
        transaction.create(movementRef, {
          productId: productRef.id,
          productName,
          quantity: currentQuantity,
          cost: currentCost,
          unitPrice: currentUnitPrice,
          type: "remove",
          reason: "product-archive",
          date: archiveDate,
          requestId: input.requestId,
          actorUid: context.uid,
          timestamp: FieldValue.serverTimestamp(),
        });
      }
    }
    releaseProductReservation(
      transaction,
      nameReservationSnapshot,
      input.productId,
    );
    releaseProductReservation(
      transaction,
      barcodeReservationSnapshot,
      input.productId,
    );
    writeIdempotency(transaction, idemRef, {
      workspaceId: context.workspaceId,
      operation,
      requestId: input.requestId,
      requestHash,
      actorUid: context.uid,
      result,
    });
    return result;
  });
});

exports.createCategory = callable("createCategory", async (request) => {
  const context = await requireWorkspaceContext(request, MANAGEMENT_ROLES);
  await reserveMutationQuota(context);
  const input = parseCategoryRequest(request.data);
  const collections = workspaceCollections(context.workspaceId);
  const categoryId = categoryDocumentId(input.nameKey);
  const categoryRef = collections.categories.doc(categoryId);
  const categoriesByKey = collections.categories
    .where("nameKey", "==", input.nameKey)
    .where("active", "==", true)
    .limit(2);
  const operation = "createCategory";
  const requestHash = payloadHash(input);
  const idemRef = idempotencyRef(
    context.workspaceId,
    operation,
    input.requestId,
    context.uid,
  );

  return db.runTransaction(async (transaction) => {
    await revalidateWorkspaceContext(
      transaction,
      context,
      MANAGEMENT_ROLES,
    );
    const previousResult = await readIdempotency(
      transaction,
      idemRef,
      requestHash,
      context.uid,
    );
    if (previousResult) return previousResult;

    const categorySnapshot = await transaction.get(categoryRef);
    const categoriesByKeySnapshot = await transaction.get(categoriesByKey);
    if (categoriesByKeySnapshot.size > 1) {
      throw new HttpsError("failed-precondition", "Categorias inconsistentes.");
    }
    const existingCategory = categoriesByKeySnapshot.docs[0] || null;
    const result = { categoryId: existingCategory?.id || categoryId };
    if (!existingCategory && !categorySnapshot.exists) {
      transaction.create(categoryRef, {
        name: input.name,
        nameKey: input.nameKey,
        active: true,
        createdBy: context.uid,
        updatedBy: context.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (!existingCategory) {
      throw new HttpsError("already-exists", "Categoria inválida.");
    } else {
      transaction.set(
        existingCategory.ref,
        {
          nameKey: input.nameKey,
          active: true,
          updatedBy: context.uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    writeIdempotency(transaction, idemRef, {
      workspaceId: context.workspaceId,
      operation,
      requestId: input.requestId,
      requestHash,
      actorUid: context.uid,
      result,
    });
    return result;
  });
});

exports.deleteCategory = callable("deleteCategory", async (request) => {
  const context = await requireWorkspaceContext(request, MANAGEMENT_ROLES);
  await reserveMutationQuota(context);
  const input = parseCategoryRequest(request.data);
  const collections = workspaceCollections(context.workspaceId);
  const categoriesByKey = collections.categories
    .where("nameKey", "==", input.nameKey)
    .where("active", "==", true)
    .limit(2);
  const activeProductsByCategoryKey = collections.products
    .where("categoryKey", "==", input.nameKey)
    .where("archived", "==", false)
    .limit(1);
  const operation = "deleteCategory";
  const requestHash = payloadHash(input);
  const idemRef = idempotencyRef(
    context.workspaceId,
    operation,
    input.requestId,
    context.uid,
  );

  return db.runTransaction(async (transaction) => {
    await revalidateWorkspaceContext(
      transaction,
      context,
      MANAGEMENT_ROLES,
    );
    const previousResult = await readIdempotency(
      transaction,
      idemRef,
      requestHash,
      context.uid,
    );
    if (previousResult) return previousResult;

    const categoriesByKeySnapshot = await transaction.get(categoriesByKey);
    const activeProductsByCategoryKeySnapshot = await transaction.get(
      activeProductsByCategoryKey,
    );
    if (!activeProductsByCategoryKeySnapshot.empty) {
      throw new HttpsError("failed-precondition", "Categoria em uso.");
    }
    if (categoriesByKeySnapshot.size > 1) {
      throw new HttpsError("failed-precondition", "Categorias inconsistentes.");
    }

    const result = { success: true };
    for (const categoryDocument of categoriesByKeySnapshot.docs) {
      transaction.delete(categoryDocument.ref);
    }
    writeIdempotency(transaction, idemRef, {
      workspaceId: context.workspaceId,
      operation,
      requestId: input.requestId,
      requestHash,
      actorUid: context.uid,
      result,
    });
    return result;
  });
});
