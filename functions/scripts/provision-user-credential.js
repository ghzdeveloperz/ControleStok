#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const { isDeepStrictEqual } = require("node:util");

const CREDENTIAL_SCHEMA_VERSION = 1;
const BCRYPT_ROUNDS = 12;
const MAX_BCRYPT_PASSWORD_BYTES = 72;
const MIN_PASSWORD_CHARACTERS = 12;
const PROVISIONING_LEASE_MS = 15 * 60 * 1000;
const VALID_ROLES = new Set(["owner", "admin", "manager", "member", "viewer"]);
const VALID_MODES = new Set(["rotate", "migrate-legacy", "create", "reactivate"]);

const HELP = `
Provisiona ou rotaciona uma credencial do MyStoreDay com ADC.

Dry-run (padrao, sem pedir senha e sem escrever):
  node functions/scripts/provision-user-credential.js \\
    --project=<project-id> --uid=<uid> --login=<login> \\
    --workspace=<workspace-id> --role=<role> --mode=<mode>

Aplicacao com prompt TTY oculto e confirmacao:
  node functions/scripts/provision-user-credential.js \\
    --project=<project-id> --uid=<uid> --login=<login> \\
    --workspace=<workspace-id> --role=<role> --mode=<mode> --apply \\
    --confirm=<project>/<workspace>/<uid>/<login-url-encoded>/<role>/<mode>

Aplicacao lendo uma unica linha da entrada padrao:
  <secret-provider> | node functions/scripts/provision-user-credential.js \\
    --project=<project-id> --uid=<uid> --login=<login> \\
    --workspace=<workspace-id> --role=<role> --mode=<mode> \\
    --apply --password-stdin \\
    --confirm=<project>/<workspace>/<uid>/<login-url-encoded>/<role>/<mode>

Opcoes:
  --project=<id>       Projeto Firebase/GCP (obrigatorio).
  --uid=<id>           UID do Firebase Auth (obrigatorio).
  --login=<login>      Login canonico em minusculas (obrigatorio).
  --workspace=<id>     Workspace vinculado (obrigatorio).
  --role=<role>        owner, admin, manager, member ou viewer.
  --mode=<mode>        rotate, migrate-legacy, create ou reactivate.
  --apply              Autoriza alteracoes; ausente significa dry-run.
  --confirm=<valor>    Vincula project/workspace/uid/login/role/mode.
  --password-stdin     Le uma unica linha de stdin; somente com --apply.
  --help               Exibe esta ajuda sem carregar dependencias externas.

A senha nunca deve ser informada como argumento de linha de comando.
`;

class SafeError extends Error {
  constructor(message) {
    super(message);
    this.name = "SafeError";
    this.safeMessage = message;
  }
}

function parseArguments(argv) {
  const parsed = {
    apply: false,
    confirm: null,
    help: false,
    login: null,
    mode: null,
    passwordStdin: false,
    projectId: null,
    role: null,
    uid: null,
    workspaceId: null,
  };
  const seen = new Set();
  const valuedOptions = new Map([
    ["--project", "projectId"],
    ["--uid", "uid"],
    ["--login", "login"],
    ["--workspace", "workspaceId"],
    ["--role", "role"],
    ["--mode", "mode"],
    ["--confirm", "confirm"],
  ]);

  for (const argument of argv) {
    if (argument === "--help") {
      setFlag(parsed, seen, "help");
      continue;
    }
    if (argument === "--apply") {
      setFlag(parsed, seen, "apply");
      continue;
    }
    if (argument === "--password-stdin") {
      setFlag(parsed, seen, "passwordStdin");
      continue;
    }

    const separator = argument.indexOf("=");
    if (separator < 0) throw new SafeError("Opcao desconhecida ou sem valor.");
    const option = argument.slice(0, separator);
    const value = argument.slice(separator + 1);
    const key = valuedOptions.get(option);
    if (!key) throw new SafeError("Opcao desconhecida.");
    if (seen.has(key)) throw new SafeError("Uma opcao foi repetida.");
    if (value.length === 0) throw new SafeError("Uma opcao esta sem valor.");
    seen.add(key);
    parsed[key] = value;
  }

  if (parsed.help) return parsed;
  for (const required of [
    "projectId",
    "uid",
    "login",
    "workspaceId",
    "role",
    "mode",
  ]) {
    if (!parsed[required]) throw new SafeError("Faltam opcoes obrigatorias.");
  }

  validateProjectId(parsed.projectId);
  validatePathId(parsed.uid, "uid");
  validatePathId(parsed.workspaceId, "workspace");
  parsed.login = normalizeCanonicalLogin(parsed.login);
  parsed.role = normalizeRole(parsed.role);
  if (!VALID_MODES.has(parsed.mode)) {
    throw new SafeError("Modo de provisionamento invalido.");
  }

  if (!parsed.apply) {
    if (parsed.confirm !== null || parsed.passwordStdin) {
      throw new SafeError(
        "--confirm e --password-stdin so podem ser usados com --apply.",
      );
    }
    return parsed;
  }

  const expectedConfirmation =
    `${parsed.projectId}/${parsed.workspaceId}/${parsed.uid}/` +
    `${encodeURIComponent(parsed.login)}/${parsed.role}/${parsed.mode}`;
  if (parsed.confirm !== expectedConfirmation) {
    throw new SafeError("A confirmacao de aplicacao nao corresponde ao destino.");
  }
  return parsed;
}

function setFlag(parsed, seen, key) {
  if (seen.has(key)) throw new SafeError("Uma opcao foi repetida.");
  seen.add(key);
  parsed[key] = true;
}

function validateProjectId(value) {
  if (
    value !== value.normalize("NFKC").trim() ||
    value.length < 6 ||
    value.length > 30 ||
    !/^[a-z][a-z0-9-]*[a-z0-9]$/u.test(value)
  ) {
    throw new SafeError("Identificador de projeto invalido.");
  }
}

function validatePathId(value, fieldName) {
  if (
    typeof value !== "string" ||
    value !== value.normalize("NFKC").trim() ||
    value.length < 1 ||
    value.length > 128 ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    /[\u0000-\u001F\u007F]/u.test(value)
  ) {
    throw new SafeError(`Identificador de ${fieldName} invalido.`);
  }
}

function normalizeCanonicalLogin(value) {
  if (typeof value !== "string") throw new SafeError("Login invalido.");
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("pt-BR");
  if (
    normalized.length < 1 ||
    normalized.length > 128 ||
    /[\u0000-\u001F\u007F]/u.test(normalized) ||
    value !== normalized
  ) {
    throw new SafeError("Login deve estar no formato canonico.");
  }
  return normalized;
}

function normalizeRole(value) {
  if (typeof value !== "string" || value !== value.trim().toLowerCase()) {
    throw new SafeError("Role invalida.");
  }
  if (!VALID_ROLES.has(value)) throw new SafeError("Role invalida.");
  return value;
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function validatePassword(password) {
  if (typeof password !== "string") throw new SafeError("Senha invalida.");
  const characterCount = [...password].length;
  const byteCount = Buffer.byteLength(password, "utf8");
  if (
    characterCount < MIN_PASSWORD_CHARACTERS ||
    byteCount > MAX_BCRYPT_PASSWORD_BYTES ||
    /[\u0000-\u001F\u007F]/u.test(password)
  ) {
    throw new SafeError(
      "A senha deve ter ao menos 12 caracteres e no maximo 72 bytes, sem controles.",
    );
  }
}

function passwordValuesMatch(left, right) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  const matches =
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer);
  leftBuffer.fill(0);
  rightBuffer.fill(0);
  return matches;
}

function readHiddenLine(prompt) {
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    throw new SafeError(
      "Prompt oculto exige TTY; use --password-stdin com um pipe seguro.",
    );
  }

  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const previousRawMode = input.isRaw === true;
    const previousEncoding = input.readableEncoding;
    let value = "";
    let settled = false;

    function restore() {
      input.removeListener("data", onData);
      if (typeof input.setRawMode === "function") input.setRawMode(previousRawMode);
      if (previousEncoding) input.setEncoding(previousEncoding);
      else input.setEncoding(null);
      input.pause();
    }

    function finish(error) {
      if (settled) return;
      settled = true;
      restore();
      process.stderr.write("\n");
      if (error) reject(error);
      else resolve(value);
    }

    function onData(chunk) {
      const text = String(chunk);
      for (const character of text) {
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u0003" || character === "\u0004") {
          finish(new SafeError("Leitura de senha cancelada."));
          return;
        }
        if (character === "\b" || character === "\u007F") {
          value = [...value].slice(0, -1).join("");
          continue;
        }
        if (/[\u0000-\u001F]/u.test(character)) {
          finish(new SafeError("Entrada de senha contem controle invalido."));
          return;
        }
        value += character;
        if (Buffer.byteLength(value, "utf8") > 256) {
          finish(new SafeError("Entrada de senha excede o limite permitido."));
          return;
        }
      }
    }

    process.stderr.write(prompt);
    input.setEncoding("utf8");
    input.resume();
    input.setRawMode(true);
    input.on("data", onData);
  });
}

async function readSinglePasswordLine() {
  if (process.stdin.isTTY) {
    throw new SafeError(
      "--password-stdin exige entrada redirecionada, nao um terminal visivel.",
    );
  }

  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > 1024) {
      for (const stored of chunks) stored.fill(0);
      buffer.fill(0);
      throw new SafeError("Entrada de senha excede o limite permitido.");
    }
    chunks.push(Buffer.from(buffer));
  }

  const combined = Buffer.concat(chunks);
  for (const stored of chunks) stored.fill(0);
  let password;
  try {
    password = new TextDecoder("utf-8", { fatal: true }).decode(combined);
  } catch {
    combined.fill(0);
    throw new SafeError("Entrada de senha nao esta em UTF-8 valido.");
  }
  combined.fill(0);

  if (password.endsWith("\n")) {
    password = password.slice(0, -1);
    if (password.endsWith("\r")) password = password.slice(0, -1);
  }
  if (password.includes("\r") || password.includes("\n")) {
    throw new SafeError("--password-stdin aceita exatamente uma linha.");
  }
  return password;
}

async function obtainPassword(useStdin) {
  if (useStdin) {
    const password = await readSinglePasswordLine();
    validatePassword(password);
    return password;
  }

  const password = await readHiddenLine("Nova senha: ");
  validatePassword(password);
  const confirmation = await readHiddenLine("Confirme a nova senha: ");
  const matches = passwordValuesMatch(password, confirmation);
  if (!matches) {
    throw new SafeError("As senhas nao conferem.");
  }
  return password;
}

function timestampMillis(value, Timestamp) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

function isAcceptableBcryptHash(value) {
  if (typeof value !== "string") return false;
  const match = /^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/u.exec(value);
  if (!match) return false;
  const rounds = Number(match[1]);
  return Number.isInteger(rounds) && rounds >= 4 && rounds <= 14;
}

function isCredentialId(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function sameSnapshotVersion(left, right) {
  if (left.exists !== right.exists) return false;
  if (!left.exists) return true;
  return left.updateTime.isEqual(right.updateTime);
}

function normalizeStoredLogin(value) {
  if (typeof value !== "string") throw new SafeError("Binding existente invalido.");
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLocaleLowerCase("pt-BR");
  if (normalized !== value) throw new SafeError("Binding existente invalido.");
  return normalized;
}

function validateExistingState(state, target, Timestamp) {
  const issues = [];
  const matchingUsers = state.loginQuery.docs;
  if (matchingUsers.some((document) => document.id !== target.uid)) {
    issues.push("loginConflict");
  }
  if (matchingUsers.length > 1) issues.push("loginDuplicate");

  if (state.root.exists) {
    const root = state.root.data();
    try {
      if (
        Object.hasOwn(root, "login") &&
        normalizeStoredLogin(root.login) !== target.login
      ) {
        issues.push("rootLoginConflict");
      }
      if (Object.hasOwn(root, "workspaceId")) {
        validatePathId(root.workspaceId, "workspace persistido");
        if (root.workspaceId !== target.workspaceId) {
          issues.push("rootWorkspaceConflict");
        }
      }
      if (Object.hasOwn(root, "memberRole")) {
        if (normalizeRole(root.memberRole) !== target.role) {
          issues.push("rootRoleConflict");
        }
      }
    } catch (error) {
      if (!(error instanceof SafeError)) throw error;
      issues.push("rootBindingInvalid");
    }
    if (
      Object.hasOwn(root, "passwordHash") &&
      !isAcceptableBcryptHash(root.passwordHash)
    ) {
      issues.push("legacyPasswordHashInvalid");
    }
  }

  if (state.credential.exists) {
    const credential = state.credential.data();
    if (
      credential.uid !== target.uid ||
      credential.login !== target.login ||
      credential.workspaceId !== target.workspaceId ||
      credential.memberRole !== target.role
    ) {
      issues.push("credentialBindingConflict");
    }
    if (!isCredentialId(credential.credentialId)) {
      issues.push("credentialIdInvalid");
    }
    if (!isAcceptableBcryptHash(credential.passwordHash)) {
      issues.push("credentialPasswordHashInvalid");
    }
  }

  if (state.reservation.exists) {
    const reservation = state.reservation.data();
    const currentCredentialId = state.credential.exists
      ? state.credential.data().credentialId
      : null;
    if (
      reservation.uid !== target.uid ||
      reservation.login !== target.login ||
      reservation.workspaceId !== target.workspaceId ||
      reservation.memberRole !== target.role ||
      !isCredentialId(reservation.credentialId) ||
      reservation.credentialId !== currentCredentialId ||
      reservation.schemaVersion !== CREDENTIAL_SCHEMA_VERSION ||
      typeof reservation.active !== "boolean" ||
      reservation.provisioning !== false
    ) {
      issues.push("loginReservationConflict");
    }
  }

  if (state.uidLock.exists) {
    const lock = state.uidLock.data();
    const leaseExpiresAt = timestampMillis(lock.leaseExpiresAt, Timestamp);
    if (
      lock.active === true &&
      (leaseExpiresAt === 0 || leaseExpiresAt > Date.now())
    ) {
      issues.push("provisioningLocked");
    }
  }

  return [...new Set(issues)];
}

function hasExactClaims(authUser, target, credentialId) {
  if (!authUser || !isCredentialId(credentialId)) return false;
  const claims = authUser.customClaims ?? {};
  const keys = Object.keys(claims).sort();
  return (
    keys.length === 4 &&
    keys[0] === "credentialId" &&
    keys[1] === "login" &&
    keys[2] === "memberRole" &&
    keys[3] === "workspaceId" &&
    claims.credentialId === credentialId &&
    claims.login === target.login &&
    claims.memberRole === target.role &&
    claims.workspaceId === target.workspaceId
  );
}

function isTokenOnlyAuthUser(authUser) {
  return (
    authUser !== null &&
    authUser !== undefined &&
    authUser.email === undefined &&
    authUser.phoneNumber === undefined &&
    Array.isArray(authUser.providerData) &&
    authUser.providerData.length === 0 &&
    (authUser.multiFactor?.enrolledFactors?.length ?? 0) === 0
  );
}

function sameAuthSecurityState(left, right) {
  return (
    left?.uid === right?.uid &&
    left?.disabled === right?.disabled &&
    isDeepStrictEqual(left?.customClaims ?? {}, right?.customClaims ?? {}) &&
    isDeepStrictEqual(
      (left?.providerData ?? []).map(({ providerId, uid }) => ({ providerId, uid })),
      (right?.providerData ?? []).map(({ providerId, uid }) => ({ providerId, uid })),
    ) &&
    left?.email === right?.email &&
    left?.phoneNumber === right?.phoneNumber &&
    (left?.multiFactor?.enrolledFactors?.length ?? 0) ===
      (right?.multiFactor?.enrolledFactors?.length ?? 0)
  );
}

function validateProvisionMode(state, authUser, target, mode) {
  const issues = [];
  const root = state.root.exists ? state.root.data() : null;
  const credential = state.credential.exists ? state.credential.data() : null;
  const currentCredentialId = credential?.credentialId;
  const existingBindingMatches =
    root !== null &&
    credential !== null &&
    isCredentialId(root.credentialId) &&
    root.credentialId === currentCredentialId &&
    bindingMatches(credential, target, currentCredentialId);
  const exactCurrentClaims = hasExactClaims(
    authUser,
    target,
    currentCredentialId,
  );
  if (authUser && !isTokenOnlyAuthUser(authUser)) {
    issues.push("authProviderPresent");
  }

  if (mode === "create") {
    if (state.root.exists) issues.push("createRootExists");
    if (state.credential.exists) issues.push("createCredentialExists");
    if (state.reservation.exists) issues.push("createReservationExists");
    if (state.loginQuery.size > 0) issues.push("createLoginExists");
    if (authUser) issues.push("createAuthExists");
  } else if (mode === "migrate-legacy") {
    if (!state.root.exists) issues.push("legacyRootMissing");
    if (state.credential.exists) issues.push("legacyCredentialExists");
    if (state.reservation.exists) issues.push("legacyReservationExists");
    if (authUser) issues.push("legacyAuthExists");
    if (!isAcceptableBcryptHash(root?.passwordHash)) {
      issues.push("legacyPasswordHashMissing");
    }
  } else if (mode === "rotate") {
    if (!state.root.exists) issues.push("rotateRootMissing");
    if (!state.credential.exists) issues.push("rotateCredentialMissing");
    if (!authUser) issues.push("rotateAuthMissing");
    if (!existingBindingMatches) issues.push("rotateBindingInvalid");
    if (root?.active !== true || credential?.active !== true) {
      issues.push("rotateBindingInactive");
    }
    if (Object.hasOwn(root ?? {}, "passwordHash")) {
      issues.push("rotateLegacyHashPresent");
    }
    if (authUser?.disabled !== false) issues.push("rotateAuthDisabled");
    if (!exactCurrentClaims) issues.push("rotateClaimsInvalid");
  } else if (mode === "reactivate") {
    if (!state.root.exists) issues.push("reactivateRootMissing");
    if (!state.credential.exists) issues.push("reactivateCredentialMissing");
    if (!authUser) issues.push("reactivateAuthMissing");
    if (!existingBindingMatches) issues.push("reactivateBindingInvalid");
    if (Object.hasOwn(root ?? {}, "passwordHash")) {
      issues.push("reactivateLegacyHashPresent");
    }
    if (
      root?.active === true &&
      credential?.active === true &&
      authUser?.disabled === false &&
      exactCurrentClaims
    ) {
      issues.push("reactivateAlreadyActive");
    }
  }

  return [...new Set(issues)];
}

function printPreflight(state, authUser, issues, apply, mode) {
  console.log(apply ? "Modo: APPLY autorizado." : "Modo: DRY-RUN.");
  console.log(`Operacao declarada: ${mode}.`);
  console.log("Preflight executado sem exibir identificadores ou credenciais.");
  console.log(`Usuario raiz existente: ${state.root.exists ? "sim" : "nao"}.`);
  console.log(
    `Credencial protegida existente: ${state.credential.exists ? "sim" : "nao"}.`,
  );
  console.log(`Usuario Firebase Auth existente: ${authUser ? "sim" : "nao"}.`);
  if (authUser) {
    console.log(`Usuario Firebase Auth desabilitado: ${authUser.disabled ? "sim" : "nao"}.`);
  }
  console.log(`Conflitos de unicidade ou binding: ${issues.length}.`);
}

async function readState(db, references) {
  const loginQuery = db
    .collection("users")
    .where("login", "==", references.target.login)
    .limit(2);
  const [root, credential, reservation, uidLock, loginQuerySnapshot] =
    await Promise.all([
      references.rootRef.get(),
      references.credentialRef.get(),
      references.reservationRef.get(),
      references.uidLockRef.get(),
      loginQuery.get(),
    ]);
  return {
    credential,
    loginQuery: loginQuerySnapshot,
    reservation,
    root,
    uidLock,
  };
}

async function getOptionalAuthUser(auth, uid) {
  try {
    return await auth.getUser(uid);
  } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
}

async function passwordWasPreviouslyUsed(password, state, bcrypt) {
  const candidateHashes = [];
  if (state.root.exists) {
    const rootHash = state.root.data().passwordHash;
    if (isAcceptableBcryptHash(rootHash)) candidateHashes.push(rootHash);
  }
  if (state.credential.exists) {
    const credentialHash = state.credential.data().passwordHash;
    if (
      isAcceptableBcryptHash(credentialHash) &&
      !candidateHashes.includes(credentialHash)
    ) {
      candidateHashes.push(credentialHash);
    }
  }

  for (const hash of candidateHashes) {
    if (await bcrypt.compare(password, hash)) return true;
  }
  return false;
}

async function stageInactiveCredential(
  db,
  references,
  preflightState,
  credentialId,
  passwordHash,
  FieldValue,
  Timestamp,
) {
  const leaseExpiresAt = Timestamp.fromMillis(Date.now() + PROVISIONING_LEASE_MS);
  await db.runTransaction(async (transaction) => {
    const loginQuery = db
      .collection("users")
      .where("login", "==", references.target.login)
      .limit(2);
    const root = await transaction.get(references.rootRef);
    const credential = await transaction.get(references.credentialRef);
    const reservation = await transaction.get(references.reservationRef);
    const uidLock = await transaction.get(references.uidLockRef);
    const loginQuerySnapshot = await transaction.get(loginQuery);
    const currentState = {
      credential,
      loginQuery: loginQuerySnapshot,
      reservation,
      root,
      uidLock,
    };

    const issues = validateExistingState(currentState, references.target, Timestamp);
    if (issues.length > 0) {
      throw new SafeError("Estado alterado ou conflitante durante o provisionamento.");
    }
    if (
      !sameSnapshotVersion(preflightState.root, root) ||
      !sameSnapshotVersion(preflightState.credential, credential)
    ) {
      throw new SafeError("Estado alterado depois do preflight; execute novamente.");
    }

    const binding = {
      credentialId,
      login: references.target.login,
      memberRole: references.target.role,
      uid: references.target.uid,
      workspaceId: references.target.workspaceId,
    };
    transaction.set(
      references.rootRef,
      {
        active: false,
        credentialId,
        credentialSchemaVersion: CREDENTIAL_SCHEMA_VERSION,
        login: references.target.login,
        memberRole: references.target.role,
        passwordHash: FieldValue.delete(),
        passwordHashUpdatedAt: FieldValue.delete(),
        securityUpdatedAt: FieldValue.serverTimestamp(),
        workspaceId: references.target.workspaceId,
      },
      { merge: true },
    );
    transaction.set(references.credentialRef, {
      ...binding,
      active: false,
      passwordHash,
      rotatedAfterLegacyExposure: true,
      rotatedAt: FieldValue.serverTimestamp(),
      schemaVersion: CREDENTIAL_SCHEMA_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(references.reservationRef, {
      ...binding,
      active: false,
      leaseExpiresAt,
      provisioning: true,
      schemaVersion: CREDENTIAL_SCHEMA_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(references.uidLockRef, {
      ...binding,
      active: true,
      leaseExpiresAt,
      schemaVersion: CREDENTIAL_SCHEMA_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

function exactClaims(target, credentialId) {
  return {
    credentialId,
    login: target.login,
    memberRole: target.role,
    workspaceId: target.workspaceId,
  };
}

async function ensureDisabledAuthUser(auth, uid, preflightAuthUser) {
  if (preflightAuthUser === null) {
    const concurrentUser = await getOptionalAuthUser(auth, uid);
    if (concurrentUser !== null) {
      throw new SafeError("Usuario Auth surgiu depois do preflight.");
    }
    try {
      await auth.createUser({ disabled: true, uid });
    } catch (createError) {
      if (createError?.code === "auth/uid-already-exists") {
        throw new SafeError("Usuario Auth surgiu durante o provisionamento.");
      }
      throw createError;
    }
    return;
  }

  const currentUser = await getOptionalAuthUser(auth, uid);
  if (
    currentUser === null ||
    !sameAuthSecurityState(currentUser, preflightAuthUser) ||
    !isTokenOnlyAuthUser(currentUser)
  ) {
    throw new SafeError("Usuario Auth mudou depois do preflight.");
  }
  await auth.updateUser(uid, { disabled: true });
}

async function requireExpectedAuthUser(
  auth,
  target,
  credentialId,
  expectedDisabled,
) {
  const currentUser = await getOptionalAuthUser(auth, target.uid);
  if (
    currentUser === null ||
    currentUser.disabled !== expectedDisabled ||
    !isTokenOnlyAuthUser(currentUser) ||
    !hasExactClaims(currentUser, target, credentialId)
  ) {
    throw new SafeError("Usuario Auth divergiu durante o provisionamento.");
  }
  return currentUser;
}

function bindingMatches(data, target, credentialId) {
  return (
    data.credentialId === credentialId &&
    data.uid === target.uid &&
    data.login === target.login &&
    data.workspaceId === target.workspaceId &&
    data.memberRole === target.role
  );
}

function staleProvisioningCredentialId(state, target, Timestamp) {
  if (
    !state.root.exists ||
    !state.credential.exists ||
    !state.reservation.exists ||
    !state.uidLock.exists ||
    state.loginQuery.size !== 1 ||
    state.loginQuery.docs[0].id !== target.uid
  ) {
    return null;
  }

  const root = state.root.data();
  const credential = state.credential.data();
  const reservation = state.reservation.data();
  const uidLock = state.uidLock.data();
  const credentialId = credential.credentialId;
  const leaseExpiresAt = timestampMillis(uidLock.leaseExpiresAt, Timestamp);
  if (
    !isCredentialId(credentialId) ||
    leaseExpiresAt === 0 ||
    leaseExpiresAt > Date.now() ||
    root.active !== false ||
    root.credentialId !== credentialId ||
    root.login !== target.login ||
    root.memberRole !== target.role ||
    root.workspaceId !== target.workspaceId ||
    Object.hasOwn(root, "passwordHash") ||
    !bindingMatches(credential, target, credentialId) ||
    credential.active !== false ||
    credential.schemaVersion !== CREDENTIAL_SCHEMA_VERSION ||
    credential.rotatedAfterLegacyExposure !== true ||
    !isAcceptableBcryptHash(credential.passwordHash) ||
    !bindingMatches(reservation, target, credentialId) ||
    reservation.active !== false ||
    reservation.provisioning !== true ||
    reservation.schemaVersion !== CREDENTIAL_SCHEMA_VERSION ||
    !bindingMatches(uidLock, target, credentialId) ||
    uidLock.active !== true ||
    uidLock.schemaVersion !== CREDENTIAL_SCHEMA_VERSION
  ) {
    return null;
  }
  return credentialId;
}

async function recoverStaleProvisioning(
  db,
  auth,
  references,
  state,
  authUser,
  FieldValue,
  Timestamp,
) {
  const credentialId = staleProvisioningCredentialId(
    state,
    references.target,
    Timestamp,
  );
  if (!credentialId || (authUser && !isTokenOnlyAuthUser(authUser))) {
    throw new SafeError("Provisionamento interrompido nao pode ser recuperado automaticamente.");
  }

  if (authUser === null) {
    try {
      await auth.createUser({ disabled: true, uid: references.target.uid });
    } catch (error) {
      if (error?.code !== "auth/uid-already-exists") throw error;
    }
  }
  const currentAuthUser = await getOptionalAuthUser(auth, references.target.uid);
  if (!currentAuthUser || !isTokenOnlyAuthUser(currentAuthUser)) {
    throw new SafeError("Usuario Auth divergiu durante a recuperacao.");
  }
  await auth.updateUser(references.target.uid, { disabled: true });
  await auth.revokeRefreshTokens(references.target.uid);
  await auth.setCustomUserClaims(
    references.target.uid,
    exactClaims(references.target, credentialId),
  );
  await requireExpectedAuthUser(
    auth,
    references.target,
    credentialId,
    true,
  );

  await db.runTransaction(async (transaction) => {
    const loginQuery = db
      .collection("users")
      .where("login", "==", references.target.login)
      .limit(2);
    const [root, credential, reservation, uidLock, loginQuerySnapshot] =
      await Promise.all([
        transaction.get(references.rootRef),
        transaction.get(references.credentialRef),
        transaction.get(references.reservationRef),
        transaction.get(references.uidLockRef),
        transaction.get(loginQuery),
      ]);
    const currentState = {
      credential,
      loginQuery: loginQuerySnapshot,
      reservation,
      root,
      uidLock,
    };
    if (
      staleProvisioningCredentialId(
        currentState,
        references.target,
        Timestamp,
      ) !== credentialId
    ) {
      throw new SafeError("Estado mudou durante a recuperacao do provisionamento.");
    }
    transaction.update(references.reservationRef, {
      active: false,
      leaseExpiresAt: FieldValue.delete(),
      provisioning: false,
      recoveredAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.delete(references.uidLockRef);
  });

  await requireExpectedAuthUser(
    auth,
    references.target,
    credentialId,
    true,
  );
}

async function activateOwnBinding(
  db,
  references,
  credentialId,
  passwordHash,
  FieldValue,
) {
  await db.runTransaction(async (transaction) => {
    const loginQuery = db
      .collection("users")
      .where("login", "==", references.target.login)
      .limit(2);
    const root = await transaction.get(references.rootRef);
    const credential = await transaction.get(references.credentialRef);
    const reservation = await transaction.get(references.reservationRef);
    const uidLock = await transaction.get(references.uidLockRef);
    const loginQuerySnapshot = await transaction.get(loginQuery);

    const exactUniqueLogin =
      loginQuerySnapshot.size === 1 &&
      loginQuerySnapshot.docs[0].id === references.target.uid;
    const rootData = root.exists ? root.data() : {};
    const credentialData = credential.exists ? credential.data() : {};
    const reservationData = reservation.exists ? reservation.data() : {};
    const uidLockData = uidLock.exists ? uidLock.data() : {};
    if (
      !exactUniqueLogin ||
      !root.exists ||
      rootData.active !== false ||
      Object.hasOwn(rootData, "passwordHash") ||
      rootData.credentialId !== credentialId ||
      rootData.login !== references.target.login ||
      rootData.workspaceId !== references.target.workspaceId ||
      rootData.memberRole !== references.target.role ||
      !credential.exists ||
      !bindingMatches(credentialData, references.target, credentialId) ||
      credentialData.schemaVersion !== CREDENTIAL_SCHEMA_VERSION ||
      credentialData.rotatedAfterLegacyExposure !== true ||
      credentialData.active !== false ||
      credentialData.passwordHash !== passwordHash ||
      !reservation.exists ||
      !bindingMatches(reservationData, references.target, credentialId) ||
      reservationData.provisioning !== true ||
      reservationData.active !== false ||
      !uidLock.exists ||
      !bindingMatches(uidLockData, references.target, credentialId) ||
      uidLockData.active !== true
    ) {
      throw new SafeError("Binding proprio nao pode ser ativado com seguranca.");
    }

    transaction.update(references.rootRef, {
      active: true,
      securityActivatedAt: FieldValue.serverTimestamp(),
      securityUpdatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(references.credentialRef, {
      active: true,
      activatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(references.reservationRef, {
      active: true,
      activatedAt: FieldValue.serverTimestamp(),
      leaseExpiresAt: FieldValue.delete(),
      provisioning: false,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.delete(references.uidLockRef);
  });
}

async function deactivateOwnBinding(
  db,
  references,
  credentialId,
  FieldValue,
) {
  return db.runTransaction(async (transaction) => {
    const root = await transaction.get(references.rootRef);
    const credential = await transaction.get(references.credentialRef);
    const reservation = await transaction.get(references.reservationRef);
    const uidLock = await transaction.get(references.uidLockRef);
    const rootOwn =
      root.exists && root.data().credentialId === credentialId;
    const credentialOwn =
      credential.exists && credential.data().credentialId === credentialId;
    const reservationOwn =
      reservation.exists && reservation.data().credentialId === credentialId;
    const uidLockOwn =
      uidLock.exists &&
      bindingMatches(uidLock.data(), references.target, credentialId) &&
      uidLock.data().active === true;

    if (!uidLockOwn) return false;

    if (rootOwn) {
      transaction.update(references.rootRef, {
        active: false,
        passwordHash: FieldValue.delete(),
        passwordHashUpdatedAt: FieldValue.delete(),
        securityUpdatedAt: FieldValue.serverTimestamp(),
      });
    }
    if (credentialOwn) {
      transaction.update(references.credentialRef, {
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    if (reservationOwn) {
      transaction.update(references.reservationRef, {
        active: false,
        failedAt: FieldValue.serverTimestamp(),
        leaseExpiresAt: FieldValue.delete(),
        provisioning: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return true;
  });
}

async function releaseCleanupLock(db, references, credentialId) {
  return db.runTransaction(async (transaction) => {
    const uidLock = await transaction.get(references.uidLockRef);
    if (
      !uidLock.exists ||
      !bindingMatches(uidLock.data(), references.target, credentialId) ||
      uidLock.data().active !== true ||
      uidLock.data().cleanup !== true
    ) {
      return false;
    }
    transaction.delete(references.uidLockRef);
    return true;
  });
}

async function acquireCleanupOwnership(
  db,
  references,
  credentialId,
  FieldValue,
  Timestamp,
) {
  return db.runTransaction(async (transaction) => {
    const root = await transaction.get(references.rootRef);
    const credential = await transaction.get(references.credentialRef);
    const reservation = await transaction.get(references.reservationRef);
    const uidLock = await transaction.get(references.uidLockRef);
    const rootOwn =
      root.exists && root.data().credentialId === credentialId;
    const credentialOwn =
      credential.exists && credential.data().credentialId === credentialId;
    const reservationOwn =
      reservation.exists && reservation.data().credentialId === credentialId;
    const ownsAnyBinding = rootOwn || credentialOwn || reservationOwn;

    if (uidLock.exists) {
      const lockOwn =
        bindingMatches(uidLock.data(), references.target, credentialId) &&
        uidLock.data().active === true;
      if (!lockOwn || !ownsAnyBinding) return false;
    } else if (!ownsAnyBinding) {
      return false;
    }

    transaction.set(references.uidLockRef, {
      credentialId,
      login: references.target.login,
      memberRole: references.target.role,
      uid: references.target.uid,
      workspaceId: references.target.workspaceId,
      active: true,
      cleanup: true,
      leaseExpiresAt: Timestamp.fromMillis(
        Date.now() + PROVISIONING_LEASE_MS,
      ),
      schemaVersion: CREDENTIAL_SCHEMA_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
}

async function forceAuthClosed(auth, uid) {
  try {
    await auth.updateUser(uid, { disabled: true });
  } catch (error) {
    if (error?.code === "auth/user-not-found") return true;
    return false;
  }

  let complete = true;
  try {
    await auth.revokeRefreshTokens(uid);
  } catch {
    complete = false;
  }
  try {
    await auth.setCustomUserClaims(uid, {});
  } catch {
    complete = false;
  }
  return complete;
}

async function failClosed(
  db,
  auth,
  references,
  credentialId,
  closeAuth,
  FieldValue,
  Timestamp,
) {
  let ownsCleanup;
  try {
    ownsCleanup = await acquireCleanupOwnership(
      db,
      references,
      credentialId,
      FieldValue,
      Timestamp,
    );
  } catch {
    return false;
  }
  if (!ownsCleanup) return true;

  let firestoreClosed;
  try {
    firestoreClosed = await deactivateOwnBinding(
      db,
      references,
      credentialId,
      FieldValue,
    );
  } catch {
    firestoreClosed = false;
  }
  const authClosed = closeAuth
    ? await forceAuthClosed(auth, references.target.uid)
    : true;
  if (!firestoreClosed || !authClosed) return false;

  try {
    return await releaseCleanupLock(db, references, credentialId);
  } catch {
    return false;
  }
}

async function provision(
  db,
  auth,
  references,
  preflightState,
  preflightAuthUser,
  mode,
  password,
  bcrypt,
  FieldValue,
  Timestamp,
) {
  const expectsExistingAuthUser = mode === "rotate" || mode === "reactivate";
  if ((preflightAuthUser !== null) !== expectsExistingAuthUser) {
    throw new SafeError("O modo nao corresponde ao estado do usuario Auth.");
  }
  if (await passwordWasPreviouslyUsed(password, preflightState, bcrypt)) {
    throw new SafeError("A nova senha nao pode repetir a credencial anterior.");
  }

  const credentialId = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  let authMayBeClosed = preflightAuthUser !== null;

  try {
    await stageInactiveCredential(
      db,
      references,
      preflightState,
      credentialId,
      passwordHash,
      FieldValue,
      Timestamp,
    );

    await ensureDisabledAuthUser(
      auth,
      references.target.uid,
      preflightAuthUser,
    );
    authMayBeClosed = true;
    await auth.revokeRefreshTokens(references.target.uid);
    await auth.setCustomUserClaims(
      references.target.uid,
      exactClaims(references.target, credentialId),
    );
    await requireExpectedAuthUser(
      auth,
      references.target,
      credentialId,
      true,
    );
    await activateOwnBinding(
      db,
      references,
      credentialId,
      passwordHash,
      FieldValue,
    );
    await requireExpectedAuthUser(
      auth,
      references.target,
      credentialId,
      true,
    );
    await auth.updateUser(references.target.uid, { disabled: false });
    await requireExpectedAuthUser(
      auth,
      references.target,
      credentialId,
      false,
    );
  } catch (error) {
    const cleanupComplete = await failClosed(
      db,
      auth,
      references,
      credentialId,
      authMayBeClosed,
      FieldValue,
      Timestamp,
    );
    if (!cleanupComplete) {
      throw new SafeError(
        "Provisionamento falhou e o fechamento automatico requer verificacao administrativa.",
      );
    }
    throw error;
  }
}

function isLoopbackEmulatorHost(value) {
  return (
    typeof value === "string" &&
    /^(?:127\.0\.0\.1|localhost|\[::1\]):(?:[1-9]\d{0,4})$/u.test(value)
  );
}

function usingLocalEmulators(projectId) {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const hasFirestoreHost = typeof firestoreHost === "string";
  const hasAuthHost = typeof authHost === "string";
  if (hasFirestoreHost !== hasAuthHost) {
    throw new SafeError("Configure os emuladores de Auth e Firestore juntos.");
  }
  if (!hasFirestoreHost) return false;
  if (
    !isLoopbackEmulatorHost(firestoreHost) ||
    !isLoopbackEmulatorHost(authHost) ||
    !projectId.startsWith("demo-")
  ) {
    throw new SafeError("Emuladores exigem hosts loopback e projeto demo-*.");
  }
  return true;
}

function createReferences(db, target) {
  const authSecurityRoot = db.collection("_security").doc("auth");
  return {
    credentialRef: authSecurityRoot
      .collection("credentialEntries")
      .doc(target.uid),
    reservationRef: authSecurityRoot
      .collection("loginReservations")
      .doc(sha256(`login:v1:${target.login}`)),
    rootRef: db.collection("users").doc(target.uid),
    target,
    uidLockRef: authSecurityRoot
      .collection("provisioningLocks")
      .doc(sha256(`uid:v1:${target.uid}`)),
  };
}

async function execute(options) {
  const bcrypt = require("bcryptjs");
  const {
    applicationDefault,
    deleteApp,
    initializeApp,
  } = require("firebase-admin/app");
  const { getAuth } = require("firebase-admin/auth");
  const {
    FieldValue,
    Timestamp,
    getFirestore,
  } = require("firebase-admin/firestore");

  const localEmulators = usingLocalEmulators(options.projectId);
  const appOptions = { projectId: options.projectId };
  if (!localEmulators) appOptions.credential = applicationDefault();
  const app = initializeApp(appOptions);
  try {
    const db = getFirestore(app);
    const auth = getAuth(app);
    const target = Object.freeze({
      login: options.login,
      role: options.role,
      uid: options.uid,
      workspaceId: options.workspaceId,
    });
    const references = createReferences(db, target);
    let [preflightState, preflightAuthUser] = await Promise.all([
      readState(db, references),
      getOptionalAuthUser(auth, target.uid),
    ]);
    const recoverableCredentialId = staleProvisioningCredentialId(
      preflightState,
      target,
      Timestamp,
    );
    const canRecoverInterruptedProvisioning =
      options.mode === "reactivate" &&
      recoverableCredentialId !== null &&
      (preflightAuthUser === null || isTokenOnlyAuthUser(preflightAuthUser));
    if (canRecoverInterruptedProvisioning && !options.apply) {
      printPreflight(preflightState, preflightAuthUser, [], false, options.mode);
      console.log(
        "Provisionamento interrompido recuperavel; use APPLY confirmado para fechar o staging e reativar com nova senha.",
      );
      return;
    }
    if (canRecoverInterruptedProvisioning) {
      console.log(
        "Recuperando provisionamento interrompido de forma fail-closed antes da reativacao.",
      );
      await recoverStaleProvisioning(
        db,
        auth,
        references,
        preflightState,
        preflightAuthUser,
        FieldValue,
        Timestamp,
      );
      [preflightState, preflightAuthUser] = await Promise.all([
        readState(db, references),
        getOptionalAuthUser(auth, target.uid),
      ]);
    }
    const issues = [
      ...validateExistingState(preflightState, target, Timestamp),
      ...validateProvisionMode(
        preflightState,
        preflightAuthUser,
        target,
        options.mode,
      ),
    ];
    printPreflight(
      preflightState,
      preflightAuthUser,
      [...new Set(issues)],
      options.apply,
      options.mode,
    );
    if (issues.length > 0) {
      throw new SafeError(
        "Preflight bloqueado por conflito de unicidade, binding ou lock.",
      );
    }
    if (!options.apply) {
      console.log("Dry-run concluido. Nenhuma senha foi solicitada ou escrita feita.");
      return;
    }

    const password = await obtainPassword(options.passwordStdin);
    await provision(
      db,
      auth,
      references,
      preflightState,
      preflightAuthUser,
      options.mode,
      password,
      bcrypt,
      FieldValue,
      Timestamp,
    );
    console.log("Credencial provisionada e usuario habilitado com seguranca.");
  } finally {
    await deleteApp(app);
  }
}

function safeOperationalMessage(error) {
  if (error instanceof SafeError) return error.safeMessage;
  const code =
    typeof error?.code === "string" && /^[A-Za-z0-9_./-]{1,80}$/u.test(error.code)
      ? ` Codigo: ${error.code}.`
      : "";
  return `Falha operacional no provisionamento.${code} Nenhum dado foi exibido.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(HELP.trim());
      return;
    }
    await execute(options);
  } catch (error) {
    console.error(safeOperationalMessage(error));
    process.exitCode = 1;
  }
}

void main();
