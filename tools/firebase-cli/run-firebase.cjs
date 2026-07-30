"use strict";

const {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { generateKeyPairSync, randomBytes } = require("node:crypto");
const { tmpdir } = require("node:os");
const { join, resolve, sep } = require("node:path");
const { spawnSync } = require("node:child_process");

const isolatedConfigDirectory = resolve(__dirname, ".config");
const isolatedEmulatorDirectory = resolve(__dirname, ".cache", "emulators");
mkdirSync(isolatedConfigDirectory, { recursive: true });
mkdirSync(isolatedEmulatorDirectory, { recursive: true });

const firebaseEntryPoint = require.resolve(
  "firebase-tools/lib/bin/firebase.js",
);
const repositoryRoot = resolve(__dirname, "..", "..");
const firebaseArguments = process.argv.slice(2);
const firebaseEnvironment = {
  ...process.env,
  FIREBASE_EMULATORS_PATH: isolatedEmulatorDirectory,
  XDG_CONFIG_HOME: isolatedConfigDirectory,
};
delete firebaseEnvironment.DEBUG;
delete firebaseEnvironment.FIREBASE_DEBUG;
delete firebaseEnvironment.NODE_DEBUG;

function argumentValue(name) {
  const index = firebaseArguments.indexOf(name);
  return index >= 0 ? firebaseArguments[index + 1] : undefined;
}

function needsEphemeralEmulatorSigner() {
  const projectId = argumentValue("--project");
  const selectedEmulators = argumentValue("--only");
  return (
    firebaseArguments.includes("emulators:exec") &&
    typeof projectId === "string" &&
    /^demo-[a-z0-9-]+$/u.test(projectId) &&
    typeof selectedEmulators === "string" &&
    selectedEmulators.split(",").includes("functions")
  );
}

function createEphemeralServiceAccount(projectId) {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "mystoreday-firebase-emulator-"),
  );
  const credentialPath = join(temporaryDirectory, "service-account.json");
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { format: "pem", type: "pkcs8" },
    publicKeyEncoding: { format: "pem", type: "spki" },
  });
  const credential = {
    type: "service_account",
    project_id: projectId,
    private_key_id: randomBytes(20).toString("hex"),
    private_key: privateKey,
    client_email: `firebase-adminsdk-emulator@${projectId}.iam.gserviceaccount.com`,
    client_id: "100000000000000000001",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  };
  writeFileSync(credentialPath, `${JSON.stringify(credential)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  return { credentialPath, temporaryDirectory };
}

let ephemeralCredential;
if (needsEphemeralEmulatorSigner()) {
  const projectId = argumentValue("--project");
  ephemeralCredential = createEphemeralServiceAccount(projectId);
  firebaseEnvironment.GOOGLE_APPLICATION_CREDENTIALS =
    ephemeralCredential.credentialPath;
}

let result;
let cleanupError;
try {
  result = spawnSync(
    process.execPath,
    [firebaseEntryPoint, ...firebaseArguments],
    {
      cwd: repositoryRoot,
      env: firebaseEnvironment,
      stdio: "inherit",
      windowsHide: true,
    },
  );
} finally {
  if (ephemeralCredential) {
    const temporaryRoot = resolve(tmpdir());
    const disposableDirectory = resolve(
      ephemeralCredential.temporaryDirectory,
    );
    const expectedPrefix = `${temporaryRoot}${sep}mystoreday-firebase-emulator-`;
    if (!disposableDirectory.startsWith(expectedPrefix)) {
      cleanupError = new Error(
        "Diretorio temporario inesperado; limpeza recusada.",
      );
    } else {
      try {
        rmSync(disposableDirectory, { force: true, recursive: true });
      } catch (error) {
        cleanupError = error;
      }
    }
  }
}

if (cleanupError) throw cleanupError;

if (result.error) throw result.error;
if (result.signal) {
  throw new Error(`Firebase CLI interrompida pelo sinal ${result.signal}.`);
}
process.exitCode = result.status ?? 1;
