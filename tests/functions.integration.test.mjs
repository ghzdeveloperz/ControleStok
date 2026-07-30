import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

import { deleteApp as deleteWebApp, initializeApp as initializeWebApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth as getWebAuth,
  getIdTokenResult,
  signInWithEmailAndPassword,
  signInWithCustomToken,
} from "firebase/auth";
import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from "firebase/functions";

const PROJECT_ID = "demo-mystoreday-functions";
const FUNCTIONS_REGION = "southamerica-east1";
const AUTH_EMULATOR_URL = "http://127.0.0.1:9099";
const FIRESTORE_EMULATOR_URL = "http://127.0.0.1:8080";
const FUNCTIONS_EMULATOR_HOST = "127.0.0.1";
const FUNCTIONS_EMULATOR_PORT = 5001;

const MEMBER_UID = "functions-owner-a";
const WORKSPACE_ID = "functions-workspace-a";
const MEMBER_LOGIN = "owner.functions@example.test";
const MEMBER_ROLE = "owner";
const CREDENTIAL_ID = "a".repeat(64);
const PASSWORD = "Integration-password-2026!";

const STOCK_PRODUCT_ID = "stock-concurrency-product";
const IDEMPOTENT_PRODUCT_ID = "stock-idempotency-product";
const ARCHIVE_PRODUCT_ID = "archive-concurrency-product";

process.env.GCLOUD_PROJECT ??= PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT ??= PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

const requireFromFunctions = createRequire(
  new URL("../functions/package.json", import.meta.url),
);
const {
  deleteApp: deleteAdminApp,
  initializeApp: initializeAdminApp,
} = requireFromFunctions("firebase-admin/app");
const { getAuth: getAdminAuth } = requireFromFunctions("firebase-admin/auth");
const {
  FieldValue,
  getFirestore: getAdminFirestore,
} = requireFromFunctions("firebase-admin/firestore");
const bcrypt = requireFromFunctions("bcryptjs");

function businessDate() {
  return new Date().toISOString().slice(0, 10);
}

function functionsErrorCode(expectedCode) {
  return (error) => {
    assert.ok(error && typeof error === "object", "erro callable ausente");
    assert.ok(
      error.code === expectedCode || error.code === `functions/${expectedCode}`,
      `esperado ${expectedCode}, recebido ${String(error.code)}`,
    );
    return true;
  };
}

async function deleteEmulatorData(baseUrl, resource, emulatorName) {
  let response;
  try {
    response = await fetch(`${baseUrl}${resource}`, { method: "DELETE" });
  } catch (error) {
    throw new Error(
      `${emulatorName} indisponivel em ${baseUrl}. Inicie Auth, Firestore e Functions antes deste teste.`,
      { cause: error },
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `${emulatorName} recusou a limpeza (${response.status}): ${body.slice(0, 300)}`,
    );
  }
}

async function resetEmulators() {
  await Promise.all([
    deleteEmulatorData(
      AUTH_EMULATOR_URL,
      `/emulator/v1/projects/${PROJECT_ID}/accounts`,
      "Auth Emulator",
    ),
    deleteEmulatorData(
      FIRESTORE_EMULATOR_URL,
      `/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      "Firestore Emulator",
    ),
  ]);
}

function productFixture(name, quantity) {
  return {
    archived: false,
    barcode: "",
    category: "Integration",
    categoryKey: "integration",
    cost: 10,
    image: null,
    minStock: 0,
    name,
    nameKey: name.toLocaleLowerCase("pt-BR"),
    price: 10,
    quantity,
    unitPrice: 15,
  };
}

async function seedSecurityContext(adminAuth, adminDb) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const claims = {
    workspaceId: WORKSPACE_ID,
    memberRole: MEMBER_ROLE,
    login: MEMBER_LOGIN,
    credentialId: CREDENTIAL_ID,
  };

  await adminAuth.createUser({ uid: MEMBER_UID, disabled: false });
  await adminAuth.setCustomUserClaims(MEMBER_UID, claims);

  const writes = adminDb.batch();
  writes.set(adminDb.doc(`users/${MEMBER_UID}`), {
    active: true,
    credentialId: CREDENTIAL_ID,
    login: MEMBER_LOGIN,
    memberRole: MEMBER_ROLE,
    passwordHash,
    workspaceId: WORKSPACE_ID,
  });
  writes.set(
    adminDb.doc(`_security/auth/credentialEntries/${MEMBER_UID}`),
    {
      active: true,
      credentialId: CREDENTIAL_ID,
      login: MEMBER_LOGIN,
      memberRole: MEMBER_ROLE,
      passwordHash,
      rotatedAfterLegacyExposure: true,
      schemaVersion: 1,
      uid: MEMBER_UID,
      workspaceId: WORKSPACE_ID,
    },
  );
  writes.set(adminDb.doc(`users/${WORKSPACE_ID}`), {
    active: true,
    workspaceId: WORKSPACE_ID,
  });
  writes.set(
    adminDb.doc(`users/${WORKSPACE_ID}/_security/migration`),
    {
      completed: true,
      inventoryBaselineAccepted: true,
      inventoryHistoryBeforeMigrationAuthoritative: false,
      schemaVersion: 2,
    },
  );
  writes.set(
    adminDb.doc(`users/${WORKSPACE_ID}/categories/integration-category`),
    {
      active: true,
      name: "Integration",
      nameKey: "integration",
    },
  );
  writes.set(
    adminDb.doc(`users/${WORKSPACE_ID}/products/${STOCK_PRODUCT_ID}`),
    productFixture("Stock concurrency", 5),
  );
  writes.set(
    adminDb.doc(`users/${WORKSPACE_ID}/products/${IDEMPOTENT_PRODUCT_ID}`),
    productFixture("Stock idempotency", 1),
  );
  writes.set(
    adminDb.doc(`users/${WORKSPACE_ID}/products/${ARCHIVE_PRODUCT_ID}`),
    productFixture("Archive concurrency", 7),
  );
  await writes.commit();

  return { claims, passwordHash };
}

async function movementsForProduct(adminDb, productId) {
  return adminDb
    .collection(`users/${WORKSPACE_ID}/movements`)
    .where("productId", "==", productId)
    .get();
}

test(
  "Auth e mutacoes de estoque permanecem seguras sob concorrencia",
  { timeout: 120_000 },
  async (t) => {
    await resetEmulators();

    const adminApp = initializeAdminApp({ projectId: PROJECT_ID });
    const adminAuth = getAdminAuth(adminApp);
    const adminDb = getAdminFirestore(adminApp);
    const webApp = initializeWebApp({
      apiKey: "demo-api-key",
      authDomain: `${PROJECT_ID}.firebaseapp.com`,
      projectId: PROJECT_ID,
    });
    const webAuth = getWebAuth(webApp);
    connectAuthEmulator(webAuth, AUTH_EMULATOR_URL, {
      disableWarnings: true,
    });
    const functions = getFunctions(webApp, FUNCTIONS_REGION);
    connectFunctionsEmulator(
      functions,
      FUNCTIONS_EMULATOR_HOST,
      FUNCTIONS_EMULATOR_PORT,
    );

    try {
      const { claims } = await seedSecurityContext(adminAuth, adminDb);
      const loginWithPassword = httpsCallable(functions, "loginWithPassword");
      const createProduct = httpsCallable(functions, "createProduct");
      const adjustStock = httpsCallable(functions, "adjustStock");
      const updateProduct = httpsCallable(functions, "updateProduct");
      const archiveProduct = httpsCallable(functions, "archiveProduct");
      const createCategory = httpsCallable(functions, "createCategory");
      const deleteCategory = httpsCallable(functions, "deleteCategory");

      await t.test(
        "login rejeita hash legado no root e aceita credencial segregada com claims exatos",
        async () => {
          const provisionedAuthUser = await adminAuth.getUser(MEMBER_UID);
          assert.equal(provisionedAuthUser.disabled, false);
          assert.equal(provisionedAuthUser.email, undefined);
          assert.equal(provisionedAuthUser.phoneNumber, undefined);
          assert.deepEqual(provisionedAuthUser.providerData, []);
          assert.equal(
            provisionedAuthUser.multiFactor?.enrolledFactors?.length ?? 0,
            0,
          );
          assert.deepEqual(provisionedAuthUser.customClaims, claims);

          await assert.rejects(
            loginWithPassword({
              login: MEMBER_LOGIN,
              password: PASSWORD,
            }),
            functionsErrorCode("unauthenticated"),
          );

          await adminDb.doc(`users/${MEMBER_UID}`).update({
            passwordHash: FieldValue.delete(),
          });

          const loginResult = await loginWithPassword({
            login: MEMBER_LOGIN,
            password: PASSWORD,
          });
          assert.equal(loginResult.data.workspaceId, WORKSPACE_ID);
          assert.equal(loginResult.data.login, MEMBER_LOGIN);
          assert.equal(loginResult.data.memberRole, MEMBER_ROLE);
          assert.equal(typeof loginResult.data.token, "string");
          assert.ok(loginResult.data.token.length > 20);

          const credential = await signInWithCustomToken(
            webAuth,
            loginResult.data.token,
          );
          assert.equal(credential.user.uid, MEMBER_UID);

          const tokenResult = await getIdTokenResult(credential.user, true);
          const actualBusinessClaims = Object.fromEntries(
            Object.keys(claims).map((key) => [key, tokenResult.claims[key]]),
          );
          assert.deepEqual(actualBusinessClaims, claims);

          await adminAuth.setCustomUserClaims(MEMBER_UID, {
            ...claims,
            unexpectedPrivilege: true,
          });
          try {
            await assert.rejects(
              loginWithPassword({
                login: MEMBER_LOGIN,
                password: PASSWORD,
              }),
              functionsErrorCode("unauthenticated"),
            );
          } finally {
            await adminAuth.setCustomUserClaims(MEMBER_UID, claims);
          }
        },
      );

      await t.test(
        "sessao anonima ou de provedor password nao acessa callables protegidas",
        async () => {
          const providerApp = initializeWebApp(
            {
              apiKey: "demo-api-key",
              authDomain: `${PROJECT_ID}.firebaseapp.com`,
              projectId: PROJECT_ID,
            },
            "provider-negative-test",
          );
          const providerAuth = getWebAuth(providerApp);
          connectAuthEmulator(providerAuth, AUTH_EMULATOR_URL, {
            disableWarnings: true,
          });
          const providerFunctions = getFunctions(providerApp, FUNCTIONS_REGION);
          connectFunctionsEmulator(
            providerFunctions,
            FUNCTIONS_EMULATOR_HOST,
            FUNCTIONS_EMULATOR_PORT,
          );
          const providerAdjustStock = httpsCallable(
            providerFunctions,
            "adjustStock",
          );
          const payload = {
            productId: STOCK_PRODUCT_ID,
            type: "add",
            quantity: 1,
            date: businessDate(),
            requestId: "provider-negative-request",
          };

          try {
            await assert.rejects(
              providerAdjustStock(payload),
              functionsErrorCode("unauthenticated"),
            );
            await adminAuth.createUser({
              uid: "password-provider-user",
              email: "password-provider@example.test",
              password: "Password-provider-2026!",
            });
            await signInWithEmailAndPassword(
              providerAuth,
              "password-provider@example.test",
              "Password-provider-2026!",
            );
            await assert.rejects(
              providerAdjustStock(payload),
              functionsErrorCode("permission-denied"),
            );
          } finally {
            await deleteWebApp(providerApp);
          }
        },
      );

      await t.test(
        "categorias e produtos usam somente schema normalizado e locks seguros",
        async () => {
          const firstCategory = await createCategory({
            name: "Bebidas",
            requestId: "category-create-beverages",
          });
          assert.equal(typeof firstCategory.data.categoryId, "string");

          const secondCategory = await createCategory({
            name: "Bebidas Premium",
            requestId: "category-create-premium",
          });
          assert.equal(typeof secondCategory.data.categoryId, "string");

          const created = await createProduct({
            barcode: "INTEGRATION-NEW-1",
            category: "Bebidas",
            cost: 8.5,
            date: businessDate(),
            image: null,
            minStock: 1,
            name: "Produto Novo Integracao",
            quantity: 2,
            requestId: "product-create-normalized",
            unitPrice: 12.5,
          });
          const productId = created.data.productId;
          assert.equal(typeof productId, "string");

          await assert.rejects(
            deleteCategory({
              name: "Bebidas",
              requestId: "category-delete-in-use",
            }),
            functionsErrorCode("failed-precondition"),
          );

          await updateProduct({
            productId,
            changes: {
              barcode: "INTEGRATION-NEW-2",
              category: "Bebidas Premium",
              name: "Produto Novo Atualizado",
            },
            requestId: "product-update-normalized",
          });
          await deleteCategory({
            name: "Bebidas",
            requestId: "category-delete-after-move",
          });
          await archiveProduct({
            productId,
            requestId: "product-archive-normalized",
          });
          await deleteCategory({
            name: "Bebidas Premium",
            requestId: "category-delete-after-archive",
          });

          const [product, firstCategoryDoc, secondCategoryDoc] =
            await Promise.all([
              adminDb.doc(`users/${WORKSPACE_ID}/products/${productId}`).get(),
              adminDb
                .doc(
                  `users/${WORKSPACE_ID}/categories/${firstCategory.data.categoryId}`,
                )
                .get(),
              adminDb
                .doc(
                  `users/${WORKSPACE_ID}/categories/${secondCategory.data.categoryId}`,
                )
                .get(),
            ]);
          assert.equal(product.data()?.archived, true);
          assert.equal(product.data()?.quantity, 0);
          assert.equal(firstCategoryDoc.exists, false);
          assert.equal(secondCategoryDoc.exists, false);
        },
      );

      await t.test(
        "duas remocoes concorrentes nao deixam o estoque negativo",
        async () => {
          const date = businessDate();
          const results = await Promise.allSettled([
            adjustStock({
              productId: STOCK_PRODUCT_ID,
              type: "remove",
              quantity: 4,
              date,
              requestId: "remove-concurrent-a",
            }),
            adjustStock({
              productId: STOCK_PRODUCT_ID,
              type: "remove",
              quantity: 4,
              date,
              requestId: "remove-concurrent-b",
            }),
          ]);

          const fulfilled = results.filter(
            (result) => result.status === "fulfilled",
          );
          const rejected = results.filter(
            (result) => result.status === "rejected",
          );
          assert.equal(fulfilled.length, 1);
          assert.equal(rejected.length, 1);
          assert.equal(fulfilled[0].value.data.quantity, 1);
          functionsErrorCode("failed-precondition")(rejected[0].reason);

          const product = await adminDb
            .doc(`users/${WORKSPACE_ID}/products/${STOCK_PRODUCT_ID}`)
            .get();
          assert.equal(product.data().quantity, 1);

          const movements = await movementsForProduct(
            adminDb,
            STOCK_PRODUCT_ID,
          );
          assert.equal(movements.size, 1);
          assert.equal(movements.docs[0].data().type, "remove");
          assert.equal(movements.docs[0].data().quantity, 4);
        },
      );

      await t.test(
        "o mesmo requestId concorrente aplica a mutacao uma unica vez",
        async () => {
          const payload = {
            productId: IDEMPOTENT_PRODUCT_ID,
            type: "add",
            quantity: 2,
            date: businessDate(),
            requestId: "same-request-concurrent",
            cost: 11,
            unitPrice: 11,
          };
          const [first, second] = await Promise.all([
            adjustStock(payload),
            adjustStock(payload),
          ]);

          assert.deepEqual(first.data, { quantity: 3 });
          assert.deepEqual(second.data, { quantity: 3 });

          const product = await adminDb
            .doc(`users/${WORKSPACE_ID}/products/${IDEMPOTENT_PRODUCT_ID}`)
            .get();
          assert.equal(product.data().quantity, 3);

          const movements = await movementsForProduct(
            adminDb,
            IDEMPOTENT_PRODUCT_ID,
          );
          assert.equal(movements.size, 1);
          assert.equal(movements.docs[0].data().requestId, payload.requestId);
          assert.equal(movements.docs[0].data().quantity, 2);

          await assert.rejects(
            adjustStock({ ...payload, quantity: 3 }),
            functionsErrorCode("already-exists"),
          );
          const unchangedProduct = await adminDb
            .doc(`users/${WORKSPACE_ID}/products/${IDEMPOTENT_PRODUCT_ID}`)
            .get();
          assert.equal(unchangedProduct.data().quantity, 3);
        },
      );

      await t.test(
        "archiveProduct concorrente zera o saldo e compensa uma unica vez",
        async () => {
          const results = await Promise.allSettled([
            archiveProduct({
              productId: ARCHIVE_PRODUCT_ID,
              requestId: "archive-concurrent-a",
            }),
            archiveProduct({
              productId: ARCHIVE_PRODUCT_ID,
              requestId: "archive-concurrent-b",
            }),
          ]);

          assert.equal(
            results.filter((result) => result.status === "fulfilled").length,
            2,
          );

          const product = await adminDb
            .doc(`users/${WORKSPACE_ID}/products/${ARCHIVE_PRODUCT_ID}`)
            .get();
          assert.equal(product.data().archived, true);
          assert.equal(product.data().quantity, 0);

          const movements = await movementsForProduct(
            adminDb,
            ARCHIVE_PRODUCT_ID,
          );
          assert.equal(movements.size, 1);
          assert.equal(movements.docs[0].data().type, "remove");
          assert.equal(movements.docs[0].data().reason, "product-archive");
          assert.equal(movements.docs[0].data().quantity, 7);
        },
      );

      await t.test(
        "workspace sem marcador de migracao permanece bloqueado",
        async () => {
          const markerRef = adminDb.doc(
            `users/${WORKSPACE_ID}/_security/migration`,
          );
          await markerRef.delete();
          try {
            await assert.rejects(
              adjustStock({
                productId: IDEMPOTENT_PRODUCT_ID,
                type: "add",
                quantity: 1,
                date: businessDate(),
                requestId: "migration-marker-required",
              }),
              functionsErrorCode("failed-precondition"),
            );
          } finally {
            await markerRef.set({
              completed: true,
              inventoryBaselineAccepted: true,
              inventoryHistoryBeforeMigrationAuthoritative: false,
              schemaVersion: 2,
            });
          }
        },
      );

      await t.test(
        "token antigo e negado imediatamente depois de trocar credentialId",
        async () => {
          const nextCredentialId = "b".repeat(64);
          const writes = adminDb.batch();
          writes.update(adminDb.doc(`users/${MEMBER_UID}`), {
            credentialId: nextCredentialId,
          });
          writes.update(
            adminDb.doc(`_security/auth/credentialEntries/${MEMBER_UID}`),
            { credentialId: nextCredentialId },
          );
          await writes.commit();
          await adminAuth.setCustomUserClaims(MEMBER_UID, {
            ...claims,
            credentialId: nextCredentialId,
          });

          await assert.rejects(
            adjustStock({
              productId: IDEMPOTENT_PRODUCT_ID,
              type: "add",
              quantity: 1,
              date: businessDate(),
              requestId: "stale-token-rejected",
            }),
            functionsErrorCode("permission-denied"),
          );
        },
      );
    } finally {
      await Promise.allSettled([
        deleteWebApp(webApp),
        deleteAdminApp(adminApp),
      ]);
      await resetEmulators();
    }
  },
);
