import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const PROJECT_ID = "demo-mystoreday-rules";
const WORKSPACE_ID = "workspace-a";
const MEMBER_UID = "member-a";
const MEMBER_LOGIN = "member@example.test";
const MEMBER_ROLE = "member";
const CREDENTIAL_ID = "a".repeat(64);

const rules = readFileSync(
  new URL("../firestore.rules", import.meta.url),
  "utf8",
);

const emulatorAddress =
  process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const emulatorSeparator = emulatorAddress.lastIndexOf(":");
const emulatorHost = emulatorAddress.slice(0, emulatorSeparator);
const emulatorPort = Number(emulatorAddress.slice(emulatorSeparator + 1));

let testEnvironment;

function authenticatedDatabase({
  uid = MEMBER_UID,
  workspaceId = WORKSPACE_ID,
  login = MEMBER_LOGIN,
  memberRole = MEMBER_ROLE,
  credentialId = CREDENTIAL_ID,
  signInProvider = "custom",
} = {}) {
  return testEnvironment
    .authenticatedContext(uid, {
      firebase: { sign_in_provider: signInProvider },
      workspaceId,
      login,
      memberRole,
      credentialId,
    })
    .firestore();
}

async function seedFirestore() {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();

    await Promise.all([
      setDoc(doc(database, "users", MEMBER_UID), {
        active: true,
        workspaceId: WORKSPACE_ID,
        login: MEMBER_LOGIN,
        memberRole: MEMBER_ROLE,
        credentialId: CREDENTIAL_ID,
      }),
      setDoc(doc(database, "users", "other-member"), {
        active: true,
        workspaceId: "workspace-b",
        login: "other@example.test",
        memberRole: MEMBER_ROLE,
        credentialId: "b".repeat(64),
      }),
      setDoc(
        doc(
          database,
          "_security",
          "auth",
          "credentialEntries",
          MEMBER_UID,
        ),
        {
          schemaVersion: 1,
          rotatedAfterLegacyExposure: true,
          active: true,
          uid: MEMBER_UID,
          workspaceId: WORKSPACE_ID,
          login: MEMBER_LOGIN,
          memberRole: MEMBER_ROLE,
          credentialId: CREDENTIAL_ID,
        },
      ),
      setDoc(
        doc(
          database,
          "_security",
          "auth",
          "credentialEntries",
          "other-member",
        ),
        {
          schemaVersion: 1,
          rotatedAfterLegacyExposure: true,
          active: true,
          uid: "other-member",
          workspaceId: "workspace-b",
          login: "other@example.test",
          memberRole: MEMBER_ROLE,
          credentialId: "b".repeat(64),
        },
      ),
      setDoc(doc(database, "users", WORKSPACE_ID), {
        internalWorkspaceMetadata: true,
      }),
      setDoc(doc(database, "users", WORKSPACE_ID, "products", "product-a"), {
        name: "Product A",
      }),
      setDoc(
        doc(database, "users", WORKSPACE_ID, "categories", "category-a"),
        { name: "Category A" },
      ),
      setDoc(
        doc(database, "users", WORKSPACE_ID, "movements", "movement-a"),
        { type: "entry" },
      ),
      setDoc(
        doc(database, "users", WORKSPACE_ID, "_security", "internal"),
        { secret: true },
      ),
      setDoc(doc(database, "_security", "internal"), { secret: true }),
    ]);
  });
}

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: emulatorHost,
      port: emulatorPort,
      rules,
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await seedFirestore();
});

after(async () => {
  if (testEnvironment) {
    await testEnvironment.cleanup();
  }
});

test("nega leitura quando o cliente nao esta autenticado", async () => {
  const database = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(
    getDoc(doc(database, "users", WORKSPACE_ID, "products", "product-a")),
  );
});

test("nega leitura quando o workspace do token e diferente", async () => {
  const database = authenticatedDatabase({
    uid: "other-member",
    workspaceId: "workspace-b",
    login: "other@example.test",
    credentialId: "b".repeat(64),
  });

  await assertFails(
    getDoc(doc(database, "users", WORKSPACE_ID, "products", "product-a")),
  );
});

test("nega token antigo depois da rotacao da credencial", async () => {
  const database = authenticatedDatabase({ credentialId: "c".repeat(64) });

  await assertFails(
    getDoc(doc(database, "users", WORKSPACE_ID, "products", "product-a")),
  );
});

test("nega sessao autenticada por provedor diferente de custom token", async () => {
  const database = authenticatedDatabase({ signInProvider: "password" });

  await assertFails(
    getDoc(doc(database, "users", WORKSPACE_ID, "products", "product-a")),
  );
});

test("permite leitura das colecoes operacionais ao membro ativo do workspace", async () => {
  const database = authenticatedDatabase();
  const readableCollections = [
    collection(database, "users", WORKSPACE_ID, "products"),
    collection(database, "users", WORKSPACE_ID, "categories"),
    collection(database, "users", WORKSPACE_ID, "movements"),
  ];

  await Promise.all(
    readableCollections.map((reference) => assertSucceeds(getDocs(reference))),
  );
});

test("nega leitura do documento raiz do usuario e de dados _security", async () => {
  const database = authenticatedDatabase();
  const protectedDocuments = [
    doc(database, "users", MEMBER_UID),
    doc(database, "users", WORKSPACE_ID),
    doc(database, "users", WORKSPACE_ID, "_security", "internal"),
    doc(database, "_security", "internal"),
  ];

  await Promise.all(
    protectedDocuments.map((reference) => assertFails(getDoc(reference))),
  );
});

test("nega criacao, atualizacao e exclusao feitas diretamente pelo cliente", async () => {
  const database = authenticatedDatabase();
  const documentsByCollection = {
    products: "product-a",
    categories: "category-a",
    movements: "movement-a",
  };

  for (const [collectionName, documentId] of Object.entries(
    documentsByCollection,
  )) {
    const existingDocument = doc(
      database,
      "users",
      WORKSPACE_ID,
      collectionName,
      documentId,
    );
    const newDocument = doc(
      database,
      "users",
      WORKSPACE_ID,
      collectionName,
      `${collectionName}-new`,
    );

    await assertFails(setDoc(newDocument, { tampered: true }));
    await assertFails(updateDoc(existingDocument, { tampered: true }));
    await assertFails(deleteDoc(existingDocument));
  }

  await assertFails(
    setDoc(doc(database, "users", MEMBER_UID), { active: false }),
  );
  await assertFails(
    setDoc(doc(database, "_security", "client-write"), { secret: true }),
  );
});
