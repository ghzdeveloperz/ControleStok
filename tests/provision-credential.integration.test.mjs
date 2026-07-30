import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const requireFromFunctions = createRequire(
  new URL("../functions/package.json", import.meta.url),
);
const bcrypt = requireFromFunctions("bcryptjs");
const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
const { getAuth } = requireFromFunctions("firebase-admin/auth");
const { getFirestore, Timestamp } = requireFromFunctions(
  "firebase-admin/firestore",
);

const PROJECT_ID = "demo-mystoreday-provision";
const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROVISION_SCRIPT = path.resolve(
  TEST_DIRECTORY,
  "../functions/scripts/provision-user-credential.js",
);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function target(overrides = {}) {
  return {
    login: "operador.seguro",
    mode: "create",
    role: "manager",
    uid: "operator-secure-uid",
    workspaceId: "workspace-secure",
    ...overrides,
  };
}

function runProvision(
  selectedTarget,
  { apply = false, confirmation, password = "Senha-Segura-2026!" } = {},
) {
  const args = [
    PROVISION_SCRIPT,
    `--project=${PROJECT_ID}`,
    `--uid=${selectedTarget.uid}`,
    `--login=${selectedTarget.login}`,
    `--workspace=${selectedTarget.workspaceId}`,
    `--role=${selectedTarget.role}`,
    `--mode=${selectedTarget.mode}`,
  ];
  let input;
  if (apply) {
    const expectedConfirmation =
      `${PROJECT_ID}/${selectedTarget.workspaceId}/${selectedTarget.uid}/` +
      `${encodeURIComponent(selectedTarget.login)}/${selectedTarget.role}/` +
      selectedTarget.mode;
    args.push(
      "--apply",
      "--password-stdin",
      `--confirm=${confirmation ?? expectedConfirmation}`,
    );
    input = `${password}\n`;
  }

  return spawnSync(process.execPath, args, {
    cwd: path.resolve(TEST_DIRECTORY, ".."),
    encoding: "utf8",
    env: process.env,
    input,
    maxBuffer: 1024 * 1024,
    timeout: 60_000,
  });
}

function assertSucceeded(result) {
  assert.equal(
    result.error,
    undefined,
    "Falha ao iniciar o processo de provisionamento.",
  );
  assert.equal(
    result.signal,
    null,
    "O provisionamento foi interrompido por sinal.",
  );
  assert.ok(
    Number.isInteger(result.status),
    "O provisionamento nao retornou exit code.",
  );
  assert.equal(
    result.status,
    0,
    `O provisionamento falhou.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function assertRejected(result) {
  assert.equal(
    result.error,
    undefined,
    "Falha ao iniciar o processo de provisionamento.",
  );
  assert.equal(
    result.signal,
    null,
    "O provisionamento foi interrompido por sinal.",
  );
  assert.ok(
    Number.isInteger(result.status),
    "O provisionamento nao retornou exit code.",
  );
  assert.notEqual(
    result.status,
    0,
    `O provisionamento deveria falhar.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function references(db, selectedTarget) {
  const authSecurityRoot = db.collection("_security").doc("auth");
  return {
    credential: authSecurityRoot
      .collection("credentialEntries")
      .doc(selectedTarget.uid),
    reservation: authSecurityRoot
      .collection("loginReservations")
      .doc(sha256(`login:v1:${selectedTarget.login}`)),
    root: db.collection("users").doc(selectedTarget.uid),
    uidLock: authSecurityRoot
      .collection("provisioningLocks")
      .doc(sha256(`uid:v1:${selectedTarget.uid}`)),
  };
}

function expectedClaims(selectedTarget, credentialId) {
  return {
    credentialId,
    login: selectedTarget.login,
    memberRole: selectedTarget.role,
    workspaceId: selectedTarget.workspaceId,
  };
}

async function assertActiveBinding(
  db,
  auth,
  selectedTarget,
  expectedPassword,
  previousPassword,
) {
  const refs = references(db, selectedTarget);
  const [root, credential, reservation, uidLock, authUser] = await Promise.all([
    refs.root.get(),
    refs.credential.get(),
    refs.reservation.get(),
    refs.uidLock.get(),
    auth.getUser(selectedTarget.uid),
  ]);
  const rootData = root.data();
  const credentialData = credential.data();
  const credentialId = credentialData?.credentialId;

  assert.equal(root.exists, true);
  assert.equal(rootData?.active, true);
  assert.equal(rootData?.login, selectedTarget.login);
  assert.equal(rootData?.workspaceId, selectedTarget.workspaceId);
  assert.equal(rootData?.memberRole, selectedTarget.role);
  assert.equal(Object.hasOwn(rootData ?? {}, "passwordHash"), false);
  assert.match(credentialId, /^[a-f0-9]{64}$/u);
  assert.equal(rootData?.credentialId, credentialId);
  assert.equal(credentialData?.active, true);
  assert.equal(credentialData?.rotatedAfterLegacyExposure, true);
  assert.equal(credentialData?.schemaVersion, 1);
  assert.notEqual(credentialData?.passwordHash, expectedPassword);
  assert.equal(
    await bcrypt.compare(expectedPassword, credentialData?.passwordHash),
    true,
  );
  if (previousPassword) {
    assert.equal(
      await bcrypt.compare(previousPassword, credentialData?.passwordHash),
      false,
    );
  }
  assert.equal(reservation.data()?.active, true);
  assert.equal(reservation.data()?.provisioning, false);
  assert.equal(uidLock.exists, false);
  assert.equal(authUser.disabled, false);
  assert.equal(authUser.email, undefined);
  assert.equal(authUser.phoneNumber, undefined);
  assert.deepEqual(authUser.providerData, []);
  assert.deepEqual(authUser.customClaims, expectedClaims(selectedTarget, credentialId));
  return credentialId;
}

test("provisionamento cria, rotaciona e migra credenciais sem estado inseguro", async () => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST &&
      process.env.FIREBASE_AUTH_EMULATOR_HOST,
    "Este teste exige os emuladores de Auth e Firestore.",
  );

  const app = initializeApp({ projectId: PROJECT_ID });
  const db = getFirestore(app);
  const auth = getAuth(app);

  try {
    const createTarget = target();
    const createRefs = references(db, createTarget);
    const dryRun = runProvision(createTarget);
    assertSucceeded(dryRun);
    assert.match(dryRun.stdout, /DRY-RUN/u);
    assert.equal((await createRefs.root.get()).exists, false);

    const wrongConfirmation = runProvision(createTarget, {
      apply: true,
      confirmation: `${PROJECT_ID}/destino-incorreto`,
    });
    assertRejected(wrongConfirmation);
    assert.equal((await createRefs.root.get()).exists, false);

    const weakPassword = runProvision(createTarget, {
      apply: true,
      password: "curta",
    });
    assertRejected(weakPassword);
    assert.equal((await createRefs.root.get()).exists, false);

    const firstPassword = "Senha-Segura-2026!";
    const created = runProvision(createTarget, {
      apply: true,
      password: firstPassword,
    });
    assertSucceeded(created);
    const firstCredentialId = await assertActiveBinding(
      db,
      auth,
      createTarget,
      firstPassword,
    );

    const reusedPassword = runProvision(
      { ...createTarget, mode: "rotate" },
      { apply: true, password: firstPassword },
    );
    assertRejected(reusedPassword);
    assert.equal(
      (await createRefs.credential.get()).data()?.credentialId,
      firstCredentialId,
      "Uma senha reutilizada alterou a credencial.",
    );

    const secondPassword = "Outra-Senha-Segura-2026!";
    const rotated = runProvision(
      { ...createTarget, mode: "rotate" },
      { apply: true, password: secondPassword },
    );
    assertSucceeded(rotated);
    const secondCredentialId = await assertActiveBinding(
      db,
      auth,
      createTarget,
      secondPassword,
      firstPassword,
    );
    assert.notEqual(secondCredentialId, firstCredentialId);

    await createRefs.reservation.update({ workspaceId: 42 });
    const malformedReservation = runProvision(
      { ...createTarget, mode: "rotate" },
      { apply: true, password: "Terceira-Senha-Segura-2026!" },
    );
    assertRejected(malformedReservation);
    assert.equal(
      (await createRefs.credential.get()).data()?.credentialId,
      secondCredentialId,
      "Metadata malformada alterou a credencial.",
    );
    assert.equal((await auth.getUser(createTarget.uid)).disabled, false);

    const legacyTarget = target({
      login: "usuario.legado",
      mode: "migrate-legacy",
      role: "member",
      uid: "legacy-user-uid",
      workspaceId: "workspace-legacy-auth",
    });
    const legacyPassword = "Senha-Legada-2025!";
    await references(db, legacyTarget).root.set({
      active: true,
      login: legacyTarget.login,
      memberRole: legacyTarget.role,
      passwordHash: await bcrypt.hash(legacyPassword, 4),
      workspaceId: legacyTarget.workspaceId,
    });
    const migratedPassword = "Senha-Nova-Legado-2026!";
    const migrated = runProvision(legacyTarget, {
      apply: true,
      password: migratedPassword,
    });
    assertSucceeded(migrated);
    await assertActiveBinding(
      db,
      auth,
      legacyTarget,
      migratedPassword,
      legacyPassword,
    );

    const interruptedTarget = target({
      login: "provisionamento.interrompido",
      mode: "reactivate",
      role: "admin",
      uid: "interrupted-provision-uid",
      workspaceId: "workspace-interrupted",
    });
    const interruptedRefs = references(db, interruptedTarget);
    const interruptedCredentialId = "c".repeat(64);
    const interruptedBinding = {
      credentialId: interruptedCredentialId,
      login: interruptedTarget.login,
      memberRole: interruptedTarget.role,
      uid: interruptedTarget.uid,
      workspaceId: interruptedTarget.workspaceId,
    };
    const interruptedBatch = db.batch();
    interruptedBatch.set(interruptedRefs.root, {
      active: false,
      credentialId: interruptedCredentialId,
      credentialSchemaVersion: 1,
      login: interruptedTarget.login,
      memberRole: interruptedTarget.role,
      workspaceId: interruptedTarget.workspaceId,
    });
    interruptedBatch.set(interruptedRefs.credential, {
      ...interruptedBinding,
      active: false,
      passwordHash: await bcrypt.hash("Staging-Interrompido-2026!", 12),
      rotatedAfterLegacyExposure: true,
      schemaVersion: 1,
    });
    interruptedBatch.set(interruptedRefs.reservation, {
      ...interruptedBinding,
      active: false,
      leaseExpiresAt: Timestamp.fromMillis(Date.now() - 60_000),
      provisioning: true,
      schemaVersion: 1,
    });
    interruptedBatch.set(interruptedRefs.uidLock, {
      ...interruptedBinding,
      active: true,
      leaseExpiresAt: Timestamp.fromMillis(Date.now() - 60_000),
      schemaVersion: 1,
    });
    await interruptedBatch.commit();

    const interruptedDryRun = runProvision(interruptedTarget);
    assertSucceeded(interruptedDryRun);
    assert.match(interruptedDryRun.stdout, /interrompido recuperavel/u);
    assert.equal(
      (await interruptedRefs.reservation.get()).data()?.provisioning,
      true,
    );

    const recoveredPassword = "Senha-Recuperada-2026!";
    const recovered = runProvision(interruptedTarget, {
      apply: true,
      password: recoveredPassword,
    });
    assertSucceeded(recovered);
    assert.match(recovered.stdout, /Recuperando provisionamento interrompido/u);
    await assertActiveBinding(
      db,
      auth,
      interruptedTarget,
      recoveredPassword,
      "Staging-Interrompido-2026!",
    );

    const conflictTarget = target({
      login: "login.em.uso",
      uid: "conflicting-target-uid",
    });
    await db.collection("users").doc("existing-login-owner").set({
      active: true,
      login: conflictTarget.login,
    });
    const conflict = runProvision(conflictTarget, { apply: true });
    assertRejected(conflict);
    await assert.rejects(
      auth.getUser(conflictTarget.uid),
      (error) => error?.code === "auth/user-not-found",
    );
    assert.equal((await references(db, conflictTarget).root.get()).exists, false);
  } finally {
    await deleteApp(app);
  }
});
