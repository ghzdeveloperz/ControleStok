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
const { deleteApp, initializeApp } = requireFromFunctions("firebase-admin/app");
const { getFirestore } = requireFromFunctions("firebase-admin/firestore");

const PROJECT_ID = "demo-mystoreday-migration";
const WORKSPACE_ID = "workspace-legacy";
const TEST_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_SCRIPT = path.resolve(
  TEST_DIRECTORY,
  "../functions/scripts/migrate-workspace-security.js",
);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function runMigration(workspaceId, { apply = false, confirm } = {}) {
  const args = [
    MIGRATION_SCRIPT,
    `--project=${PROJECT_ID}`,
    `--workspace=${workspaceId}`,
  ];
  if (apply) {
    args.push(
      "--apply",
      "--accept-inventory-baseline",
      `--confirm=${confirm ?? `${PROJECT_ID}/${workspaceId}`}`,
    );
  }

  return spawnSync(process.execPath, args, {
    cwd: path.resolve(TEST_DIRECTORY, ".."),
    encoding: "utf8",
    env: process.env,
    timeout: 30_000,
  });
}

function assertSucceeded(result) {
  assert.equal(result.error, undefined, "Falha ao iniciar o processo de migracao.");
  assert.equal(result.signal, null, "A migracao foi interrompida por sinal.");
  assert.ok(Number.isInteger(result.status), "A migracao nao retornou exit code.");
  assert.equal(
    result.status,
    0,
    `A migracao falhou.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function assertRejected(result) {
  assert.equal(result.error, undefined, "Falha ao iniciar o processo de migracao.");
  assert.equal(result.signal, null, "A migracao foi interrompida por sinal.");
  assert.ok(Number.isInteger(result.status), "A migracao nao retornou exit code.");
  assert.notEqual(
    result.status,
    0,
    `A migracao deveria falhar.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function legacyProduct(category, name, barcode) {
  return {
    barcode,
    category,
    cost: 12.34,
    image: null,
    minStock: 1,
    name,
    quantity: 5,
    unitPrice: 15.5,
  };
}

test("migracao de workspace e fail-closed, idempotente e auditavel", async () => {
  assert.ok(
    process.env.FIRESTORE_EMULATOR_HOST,
    "Este teste so pode executar com o Firestore Emulator.",
  );

  const app = initializeApp({ projectId: PROJECT_ID });
  const db = getFirestore(app);
  const root = db.collection("users").doc(WORKSPACE_ID);
  const categoryName = "Eletronicos";
  const categoryKey = categoryName.toLocaleLowerCase("pt-BR");
  const categoryId = sha256(`category:${categoryKey}`).slice(0, 40);
  const productNameKey = "teclado";
  const barcodeKey = "abc-1";
  const nameLockId = sha256(`productNameLocks:v1:${productNameKey}`);
  const barcodeLockId = sha256(`productBarcodeLocks:v1:${barcodeKey}`);

  try {
    await root.set({ active: true, login: WORKSPACE_ID });
    await root.collection("categories").doc("legacy-category").set({
      name: `  ${categoryName}  `,
    });
    await root
      .collection("products")
      .doc("product-1")
      .set(legacyProduct(` ${categoryName} `, "  Teclado  ", " ABC-1 "));

    const dryRun = runMigration(WORKSPACE_ID);
    assertSucceeded(dryRun);
    assert.match(dryRun.stdout, /DRY-RUN/u);
    assert.equal(
      (await root.collection("products").doc("product-1").get()).data()
        ?.nameKey,
      undefined,
      "O dry-run alterou dados.",
    );

    const wrongConfirmation = runMigration(WORKSPACE_ID, {
      apply: true,
      confirm: `${PROJECT_ID}/outro-workspace`,
    });
    assertRejected(wrongConfirmation);
    assert.equal(
      (await root.collection("_security").doc("migration").get()).exists,
      false,
      "Uma confirmacao incorreta criou o marcador.",
    );

    const applied = runMigration(WORKSPACE_ID, { apply: true });
    assertSucceeded(applied);

    const [oldCategory, category, product, nameLock, barcodeLock, marker] =
      await Promise.all([
        root.collection("categories").doc("legacy-category").get(),
        root.collection("categories").doc(categoryId).get(),
        root.collection("products").doc("product-1").get(),
        root
          .collection("_security")
          .doc("uniqueness")
          .collection("productNameLocks")
          .doc(nameLockId)
          .get(),
        root
          .collection("_security")
          .doc("uniqueness")
          .collection("productBarcodeLocks")
          .doc(barcodeLockId)
          .get(),
        root.collection("_security").doc("migration").get(),
      ]);

    assert.equal(oldCategory.exists, false);
    assert.equal(category.data()?.active, true);
    assert.equal(category.data()?.nameKey, categoryKey);
    assert.equal(product.data()?.archived, false);
    assert.equal(product.data()?.nameKey, productNameKey);
    assert.equal(product.data()?.barcodeKey, barcodeKey);
    assert.equal(product.data()?.categoryKey, categoryKey);
    assert.equal(product.data()?.inventoryBaselineQuantity, 5);
    assert.equal(product.data()?.inventoryBaselineVersion, 2);
    assert.equal(nameLock.data()?.productId, "product-1");
    assert.equal(barcodeLock.data()?.productId, "product-1");
    assert.equal(marker.data()?.completed, true);
    assert.equal(marker.data()?.inventoryBaselineAccepted, true);
    assert.equal(
      marker.data()?.inventoryHistoryBeforeMigrationAuthoritative,
      false,
    );
    assert.equal(marker.data()?.schemaVersion, 2);
    const firstCompletedAt = marker.data().completedAt.toMillis();

    const repeated = runMigration(WORKSPACE_ID, { apply: true });
    assertSucceeded(repeated);
    const repeatedMarker = await root
      .collection("_security")
      .doc("migration")
      .get();
    assert.equal(repeatedMarker.data()?.completedAt.toMillis(), firstCompletedAt);

    const collisionRoot = db.collection("users").doc("workspace-collision");
    await collisionRoot.set({ active: true, login: "workspace-collision" });
    await collisionRoot.collection("categories").doc("category").set({
      name: "Geral",
    });
    await collisionRoot
      .collection("products")
      .doc("product-a")
      .set(legacyProduct("Geral", "Duplicado", "codigo-a"));
    await collisionRoot
      .collection("products")
      .doc("product-b")
      .set(legacyProduct("Geral", " duplicado ", "codigo-b"));

    const collision = runMigration("workspace-collision", { apply: true });
    assertRejected(collision);
    const [collisionMarker, collisionProduct, collisionLocks] =
      await Promise.all([
        collisionRoot.collection("_security").doc("migration").get(),
        collisionRoot.collection("products").doc("product-a").get(),
        collisionRoot
          .collection("_security")
          .doc("uniqueness")
          .collection("productNameLocks")
          .get(),
      ]);
    assert.equal(collisionMarker.exists, false);
    assert.equal(collisionProduct.data()?.nameKey, undefined);
    assert.equal(collisionLocks.empty, true);

    const invalidCategoryRoot = db
      .collection("users")
      .doc("workspace-invalid-category-boolean");
    await invalidCategoryRoot.set({
      active: true,
      login: "workspace-invalid-category-boolean",
    });
    await invalidCategoryRoot.collection("categories").doc("category").set({
      active: "false",
      name: "Geral",
    });
    await invalidCategoryRoot
      .collection("products")
      .doc("product")
      .set(legacyProduct("Geral", "Produto", "codigo-categoria-invalida"));

    const invalidCategoryBoolean = runMigration(
      "workspace-invalid-category-boolean",
      { apply: true },
    );
    assertRejected(invalidCategoryBoolean);
    const [invalidCategoryMarker, invalidCategory, invalidCategoryProduct] =
      await Promise.all([
        invalidCategoryRoot.collection("_security").doc("migration").get(),
        invalidCategoryRoot.collection("categories").doc("category").get(),
        invalidCategoryRoot.collection("products").doc("product").get(),
      ]);
    assert.equal(invalidCategoryMarker.exists, false);
    assert.equal(invalidCategory.data()?.active, "false");
    assert.equal(invalidCategoryProduct.data()?.nameKey, undefined);

    const invalidProductRoot = db
      .collection("users")
      .doc("workspace-invalid-product-boolean");
    await invalidProductRoot.set({
      active: true,
      login: "workspace-invalid-product-boolean",
    });
    await invalidProductRoot.collection("categories").doc("category").set({
      active: true,
      name: "Geral",
    });
    await invalidProductRoot.collection("products").doc("product").set({
      ...legacyProduct("Geral", "Produto", "codigo-produto-invalido"),
      archived: "true",
    });

    const invalidProductBoolean = runMigration(
      "workspace-invalid-product-boolean",
      { apply: true },
    );
    assertRejected(invalidProductBoolean);
    const [invalidProductMarker, invalidProduct, invalidProductLocks] =
      await Promise.all([
        invalidProductRoot.collection("_security").doc("migration").get(),
        invalidProductRoot.collection("products").doc("product").get(),
        invalidProductRoot
          .collection("_security")
          .doc("uniqueness")
          .collection("productNameLocks")
          .get(),
      ]);
    assert.equal(invalidProductMarker.exists, false);
    assert.equal(invalidProduct.data()?.archived, "true");
    assert.equal(invalidProductLocks.empty, true);
  } finally {
    await deleteApp(app);
  }
});
