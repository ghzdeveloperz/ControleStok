#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");

const PAGE_SIZE = 50;
const MAX_BATCH_WRITES = 399;
const MAX_MIGRATION_COLLECTION_DOCUMENTS = 20_000;
const MAX_MIGRATION_LOCK_DOCUMENTS = 40_000;
const MAX_MIGRATION_TOTAL_BYTES = 192 * 1024 * 1024;
const SCHEMA_VERSION = 2;
const MIGRATION_ACTOR = "security-migration";
const MIGRATION_LEASE_MS = 15 * 60 * 1000;
const MAX_STOCK = 1_000_000_000;
const MAX_MONEY = 1_000_000_000_000;

const HELP = `
Migra as chaves de seguranca de um workspace do MyStoreDay.

Uso:
  node functions/scripts/migrate-workspace-security.js \\
    --project=<firebase-project-id> --workspace=<workspace-id>

O comando acima executa apenas o dry-run. Para aplicar, a confirmacao combina
explicitamente o projeto e o workspace informados:

  node functions/scripts/migrate-workspace-security.js \\
    --project=<firebase-project-id> --workspace=<workspace-id> \\
    --apply --accept-inventory-baseline \\
    --confirm=<firebase-project-id>/<workspace-id>

Opcoes:
  --project=<id>     Projeto Firebase/GCP de destino (obrigatorio).
  --workspace=<id>   Documento raiz do workspace (obrigatorio).
  --apply            Autoriza as escritas apos o preflight completo.
  --accept-inventory-baseline
                     Confirma que o saldo atual foi auditado e passa a ser o
                     baseline; movimentos anteriores nao sao autoritativos.
  --confirm=<valor>  Deve ser exatamente <project>/<workspace> com --apply.
  --help             Exibe esta ajuda.

Autenticacao:
  Usa Application Default Credentials (ADC) fora do emulador. O modo local sem
  ADC exige Firestore Emulator em loopback e projeto demo-*.
`;

class CliError extends Error {
  constructor(message) {
    super(message);
    this.name = "CliError";
    this.safeMessage = message;
  }
}

function parseArguments(argv) {
  const parsed = {
    acceptInventoryBaseline: false,
    apply: false,
    confirm: null,
    help: false,
    projectId: null,
    workspaceId: null,
  };
  const seen = new Set();

  for (const argument of argv) {
    if (argument === "--help") {
      if (seen.has("help")) throw new CliError("Opcao --help repetida.");
      seen.add("help");
      parsed.help = true;
      continue;
    }
    if (argument === "--apply") {
      if (seen.has("apply")) throw new CliError("Opcao --apply repetida.");
      seen.add("apply");
      parsed.apply = true;
      continue;
    }
    if (argument === "--accept-inventory-baseline") {
      if (seen.has("acceptInventoryBaseline")) {
        throw new CliError("Opcao --accept-inventory-baseline repetida.");
      }
      seen.add("acceptInventoryBaseline");
      parsed.acceptInventoryBaseline = true;
      continue;
    }

    const separator = argument.indexOf("=");
    if (separator < 0) {
      throw new CliError("Opcao desconhecida ou sem valor.");
    }

    const option = argument.slice(0, separator);
    const value = argument.slice(separator + 1);
    const mapping = new Map([
      ["--project", "projectId"],
      ["--workspace", "workspaceId"],
      ["--confirm", "confirm"],
    ]);
    const key = mapping.get(option);
    if (!key) throw new CliError("Opcao desconhecida.");
    if (seen.has(key)) throw new CliError(`Opcao ${option} repetida.`);
    if (!value) throw new CliError(`Opcao ${option} sem valor.`);
    seen.add(key);
    parsed[key] = value;
  }

  if (parsed.help) return parsed;
  if (!parsed.projectId || !parsed.workspaceId) {
    throw new CliError("--project e --workspace sao obrigatorios.");
  }
  validateProjectId(parsed.projectId);
  validatePathId(parsed.workspaceId, "workspace");

  if (parsed.apply) {
    if (!parsed.acceptInventoryBaseline) {
      throw new CliError(
        "A aplicacao exige --accept-inventory-baseline apos auditoria do saldo.",
      );
    }
    if (parsed.confirm !== `${parsed.projectId}/${parsed.workspaceId}`) {
      throw new CliError(
        "A aplicacao exige --confirm exatamente igual a <project>/<workspace>.",
      );
    }
  } else if (
    parsed.confirm !== null ||
    parsed.acceptInventoryBaseline
  ) {
    throw new CliError(
      "--confirm e --accept-inventory-baseline so podem ser usados com --apply.",
    );
  }

  return parsed;
}

function validateProjectId(value) {
  if (
    value !== value.normalize("NFKC").trim() ||
    value.length < 6 ||
    value.length > 30 ||
    !/^[a-z][a-z0-9-]*[a-z0-9]$/u.test(value)
  ) {
    throw new CliError("Identificador de projeto invalido.");
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
    throw new CliError(`Identificador de ${fieldName} invalido.`);
  }
}

function isLoopbackEmulatorHost(value) {
  return (
    typeof value === "string" &&
    /^(?:127\.0\.0\.1|localhost|\[::1\]):(?:[1-9]\d{0,4})$/u.test(value)
  );
}

function usingLocalEmulator(projectId) {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (firestoreHost === undefined) return false;
  if (
    !isLoopbackEmulatorHost(firestoreHost) ||
    !projectId.startsWith("demo-")
  ) {
    throw new CliError(
      "Emulador exige FIRESTORE_EMULATOR_HOST em loopback e projeto demo-*.",
    );
  }
  return true;
}

function normalizeText(value, fieldName, max) {
  if (typeof value !== "string") {
    throw new CliError(`${fieldName} persistido nao e texto.`);
  }
  const normalized = value.normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (
    normalized.length < 1 ||
    normalized.length > max ||
    /[\u0000-\u001F\u007F]/u.test(normalized)
  ) {
    throw new CliError(`${fieldName} persistido e invalido.`);
  }
  return normalized;
}

function normalizeBarcode(value) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new CliError("barcode persistido nao e texto.");
  }
  const normalized = value.normalize("NFKC").trim();
  if (
    normalized.length > 128 ||
    /[\u0000-\u001F\u007F]/u.test(normalized) ||
    (normalized && !/^[\p{L}\p{N}._:/+-]+$/u.test(normalized))
  ) {
    throw new CliError("barcode persistido e invalido.");
  }
  return normalized;
}

function normalizeStoredNumber(value, fieldName, { max, decimals }) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  ) {
    throw new CliError(`${fieldName} persistido e invalido.`);
  }
  const factor = 10 ** decimals;
  if (Math.abs(Math.round(value * factor) - value * factor) > 1e-7) {
    throw new CliError(`${fieldName} persistido possui precisao invalida.`);
  }
  return value;
}

function normalizeStoredBoolean(value, fieldName, defaultValue) {
  if (value === undefined) return defaultValue;
  if (typeof value !== "boolean") {
    throw new CliError(`${fieldName} persistido nao e booleano.`);
  }
  return value;
}

function readStoredImageDimensions(mimeType, bytes) {
  if (mimeType === "image/png" && bytes.length >= 24) {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }
  if (mimeType === "image/webp" && bytes.length >= 30) {
    const chunk = bytes.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      return {
        width: 1 + bytes.readUIntLE(24, 3),
        height: 1 + bytes.readUIntLE(27, 3),
      };
    }
    if (chunk === "VP8L" && bytes[20] === 0x2f) {
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
      chunk === "VP8 " &&
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
    const sizeMarkers = new Set([
      0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
      0xce, 0xcf,
    ]);
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset];
      offset += 1;
      if (marker === 0xd8 || marker === 0xd9) continue;
      if (marker === 0xda || offset + 2 > bytes.length) break;
      const segmentLength = bytes.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      if (sizeMarkers.has(marker) && segmentLength >= 7) {
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

function normalizeStoredImage(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new CliError("image persistida nao e texto.");
  }
  if (/^\/(?:assets|images)\/[A-Za-z0-9._~!$&'()+,;=:@%/-]+$/u.test(value)) {
    if (/(?:^|\/)\.{1,2}(?:\/|$)/u.test(value)) {
      throw new CliError("image persistida possui caminho invalido.");
    }
    return value;
  }

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/u.exec(
    value,
  );
  if (!match) throw new CliError("image persistida usa origem nao autorizada.");
  const bytes = Buffer.from(match[2], "base64");
  const validSignature =
    (match[1] === "image/jpeg" &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) ||
    (match[1] === "image/png" &&
      bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) ||
    (match[1] === "image/webp" &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP");
  const dimensions = readStoredImageDimensions(match[1], bytes);
  if (
    bytes.length < 12 ||
    bytes.length > 350 * 1024 ||
    !validSignature ||
    !dimensions ||
    dimensions.width < 1 ||
    dimensions.height < 1 ||
    dimensions.width > 2048 ||
    dimensions.height > 2048 ||
    dimensions.width * dimensions.height > 4_000_000
  ) {
    throw new CliError("image persistida e invalida.");
  }
  return value;
}

function normalizedKey(value) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("pt-BR");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function categoryDocumentId(key) {
  return sha256(`category:${key}`).slice(0, 40);
}

function reservationDocumentId(kind, normalizedValue) {
  return sha256(`${kind}:v1:${normalizedValue}`);
}

function increment(counter, key, amount = 1) {
  counter[key] = (counter[key] || 0) + amount;
}

function addToMapList(map, key, value) {
  const current = map.get(key);
  if (current) current.push(value);
  else map.set(key, [value]);
}

async function readPaginated(
  collectionReference,
  FieldPath,
  budget,
  label,
  maxDocuments,
) {
  const documents = [];
  let lastDocument = null;

  for (;;) {
    if (budget.aborted) {
      throw new CliError("Preflight interrompido por limite de seguranca.");
    }
    let query = collectionReference
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (lastDocument) query = query.startAfter(lastDocument);

    const snapshot = await query.get();
    if (documents.length + snapshot.size > maxDocuments) {
      budget.aborted = true;
      throw new CliError(
        `Colecao ${label} excede o limite seguro de documentos; use migracao assistida.`,
      );
    }
    let pageBytes = 0;
    for (const document of snapshot.docs) {
      pageBytes += Buffer.byteLength(JSON.stringify(document.data()), "utf8");
    }
    budget.bytes += pageBytes;
    if (budget.bytes > MAX_MIGRATION_TOTAL_BYTES) {
      budget.aborted = true;
      throw new CliError(
        "Workspace excede o limite seguro de memoria; use migracao assistida.",
      );
    }
    documents.push(...snapshot.docs);
    if (snapshot.size < PAGE_SIZE) break;
    lastDocument = snapshot.docs[snapshot.docs.length - 1];
  }

  return documents;
}

function parseCategories(snapshots, issues) {
  const categories = [];

  for (const snapshot of snapshots) {
    try {
      const data = snapshot.data();
      const name = normalizeText(data.name, "name de categoria", 80);
      const key = normalizedKey(name);
      categories.push({
        active: normalizeStoredBoolean(
          data.active,
          "active de categoria",
          true,
        ),
        canonicalId: categoryDocumentId(key),
        data,
        id: snapshot.id,
        key,
        name,
        ref: snapshot.ref,
        snapshot,
      });
    } catch (error) {
      if (!(error instanceof CliError)) throw error;
      increment(issues, "invalidCategories");
    }
  }

  return categories;
}

function parseProducts(snapshots, issues) {
  const products = [];

  for (const snapshot of snapshots) {
    try {
      const data = snapshot.data();
      const name = normalizeText(data.name, "name de produto", 120);
      const category = normalizeText(data.category, "category de produto", 80);
      const barcode = normalizeBarcode(data.barcode);
      const archived = normalizeStoredBoolean(
        data.archived,
        "archived de produto",
        false,
      );
      const quantity = normalizeStoredNumber(data.quantity, "quantity", {
        max: MAX_STOCK,
        decimals: 4,
      });
      const cost = normalizeStoredNumber(
        data.cost ?? data.price ?? data.unitPrice,
        "cost",
        { max: MAX_MONEY, decimals: 2 },
      );
      const unitPrice = normalizeStoredNumber(
        data.unitPrice ?? data.price ?? data.cost,
        "unitPrice",
        { max: MAX_MONEY, decimals: 2 },
      );
      const minStock = normalizeStoredNumber(data.minStock ?? 0, "minStock", {
        max: MAX_STOCK,
        decimals: 4,
      });
      const image = normalizeStoredImage(data.image);
      if (archived && quantity !== 0) {
        increment(issues, "archivedProductStock");
      }
      products.push({
        archived,
        barcode,
        barcodeKey: normalizedKey(barcode),
        category,
        categoryKey: normalizedKey(category),
        cost,
        data,
        id: snapshot.id,
        image,
        minStock,
        name,
        nameKey: normalizedKey(name),
        quantity,
        ref: snapshot.ref,
        snapshot,
        unitPrice,
      });
    } catch (error) {
      if (!(error instanceof CliError)) throw error;
      increment(issues, "invalidProducts");
    }
  }

  return products;
}

function analyzeDomain(categories, products, issues) {
  const categoriesByKey = new Map();
  const categoriesById = new Map();
  const activeProductsByName = new Map();
  const activeProductsByBarcode = new Map();

  for (const category of categories) {
    categoriesById.set(category.id, category);
    addToMapList(categoriesByKey, category.key, category);
  }

  for (const groupedCategories of categoriesByKey.values()) {
    const activeCategories = groupedCategories.filter((item) => item.active);
    if (activeCategories.length > 1) {
      increment(issues, "activeCategoryCollisions");
      continue;
    }
    if (activeCategories.length === 1) {
      const activeCategory = activeCategories[0];
      const target = categoriesById.get(activeCategory.canonicalId);
      if (target && target.id !== activeCategory.id) {
        increment(issues, "categoryIdConflicts");
      }
    }
  }

  const categoryIdsByCanonicalId = new Map();
  for (const category of categories.filter((item) => item.active)) {
    const previousKey = categoryIdsByCanonicalId.get(category.canonicalId);
    if (previousKey && previousKey !== category.key) {
      increment(issues, "categoryIdConflicts");
    } else {
      categoryIdsByCanonicalId.set(category.canonicalId, category.key);
    }
  }

  for (const product of products) {
    const matchingCategories = categoriesByKey.get(product.categoryKey) || [];
    if (matchingCategories.length === 0) {
      increment(issues, "missingCategoryReferences");
    } else if (
      !product.archived &&
      !matchingCategories.some((category) => category.active)
    ) {
      increment(issues, "inactiveCategoryReferences");
    }

    if (product.archived) continue;
    addToMapList(activeProductsByName, product.nameKey, product);
    if (product.barcodeKey) {
      addToMapList(activeProductsByBarcode, product.barcodeKey, product);
    }
  }

  for (const productsWithName of activeProductsByName.values()) {
    if (productsWithName.length > 1) {
      increment(issues, "activeProductNameCollisions");
    }
  }
  for (const productsWithBarcode of activeProductsByBarcode.values()) {
    if (productsWithBarcode.length > 1) {
      increment(issues, "activeProductBarcodeCollisions");
    }
  }

  return { categoriesById };
}

function timestampedPatch(current, desired, FieldValue) {
  const patch = {};
  for (const [key, value] of Object.entries(desired)) {
    if (current[key] !== value) patch[key] = value;
  }
  if (Object.keys(patch).length > 0) {
    patch.updatedAt = FieldValue.serverTimestamp();
  }
  return patch;
}

function updateWrite(snapshot, data) {
  return {
    data,
    precondition: { lastUpdateTime: snapshot.updateTime },
    ref: snapshot.ref,
    type: "update",
  };
}

function deleteWrite(snapshot) {
  return {
    precondition: { lastUpdateTime: snapshot.updateTime },
    ref: snapshot.ref,
    type: "delete",
  };
}

function createWrite(ref, data) {
  return { data, ref, type: "create" };
}

function planDocumentUpdates(
  workspaceRoot,
  categories,
  products,
  categoriesById,
  FieldValue,
  planned,
) {
  for (const category of categories) {
    const desired = {
      active: category.active,
      name: category.name,
      nameKey: category.key,
    };
    const patch = timestampedPatch(category.data, desired, FieldValue);

    if (category.active && category.id !== category.canonicalId) {
      if (categoriesById.has(category.canonicalId)) continue;
      const targetRef = workspaceRoot
        .collection("categories")
        .doc(category.canonicalId);
      planned.groups.push({
        kind: "categoryMoves",
        writes: [
          createWrite(targetRef, {
            ...category.data,
            ...desired,
            updatedAt: FieldValue.serverTimestamp(),
          }),
          deleteWrite(category.snapshot),
        ],
      });
      increment(planned.counts, "categoryMoves");
    } else if (Object.keys(patch).length > 0) {
      planned.groups.push({
        kind: "categoryUpdates",
        writes: [updateWrite(category.snapshot, patch)],
      });
      increment(planned.counts, "categoryUpdates");
    }
  }

  for (const product of products) {
    const patch = timestampedPatch(
      product.data,
      {
        archived: product.archived,
        barcode: product.barcode,
        barcodeKey: product.barcodeKey,
        category: product.category,
        categoryKey: product.categoryKey,
        cost: product.cost,
        image: product.image,
        inventoryBaselineQuantity: product.quantity,
        inventoryBaselineVersion: SCHEMA_VERSION,
        minStock: product.minStock,
        name: product.name,
        nameKey: product.nameKey,
        price: product.cost,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
      },
      FieldValue,
    );
    if (Object.keys(patch).length > 0) {
      planned.groups.push({
        kind: "productUpdates",
        writes: [updateWrite(product.snapshot, patch)],
      });
      increment(planned.counts, "productUpdates");
    }
  }
}

function buildExpectedLocks(products, issues) {
  const names = new Map();
  const barcodes = new Map();

  function addExpected(map, kind, normalizedValue, product) {
    const id = reservationDocumentId(kind, normalizedValue);
    const previous = map.get(id);
    if (
      previous &&
      (previous.productId !== product.id ||
        previous.normalizedValue !== normalizedValue)
    ) {
      increment(issues, "lockHashConflicts");
      return;
    }
    map.set(id, { normalizedValue, productId: product.id });
  }

  for (const product of products) {
    if (product.archived) continue;
    addExpected(names, "productNameLocks", product.nameKey, product);
    if (product.barcodeKey) {
      addExpected(
        barcodes,
        "productBarcodeLocks",
        product.barcodeKey,
        product,
      );
    }
  }

  return { barcodes, names };
}

function analyzeLockCollection(
  kind,
  collectionReference,
  snapshots,
  expected,
  FieldValue,
  issues,
  planned,
) {
  const existing = new Map(snapshots.map((snapshot) => [snapshot.id, snapshot]));

  for (const [id, wanted] of expected.entries()) {
    const snapshot = existing.get(id);
    if (!snapshot) {
      planned.groups.push({
        kind: "lockCreates",
        writes: [
          createWrite(collectionReference.doc(id), {
            migrationActor: MIGRATION_ACTOR,
            normalizedValue: wanted.normalizedValue,
            productId: wanted.productId,
            updatedAt: FieldValue.serverTimestamp(),
          }),
        ],
      });
      increment(planned.counts, "lockCreates");
      continue;
    }
    existing.delete(id);

    const current = snapshot.data();
    const normalizedValueIsCompatible =
      current.normalizedValue === undefined ||
      current.normalizedValue === wanted.normalizedValue;
    if (
      current.productId !== wanted.productId ||
      !normalizedValueIsCompatible
    ) {
      increment(issues, "conflictingLocks");
      continue;
    }

    if (current.normalizedValue === undefined) {
      planned.groups.push({
        kind: "lockUpdates",
        writes: [
          updateWrite(snapshot, {
            migrationActor: MIGRATION_ACTOR,
            normalizedValue: wanted.normalizedValue,
            updatedAt: FieldValue.serverTimestamp(),
          }),
        ],
      });
      increment(planned.counts, "lockUpdates");
    }
  }

  for (const snapshot of existing.values()) {
    const current = snapshot.data();
    const structurallyValid =
      typeof current.productId === "string" &&
      current.productId.length > 0 &&
      typeof current.normalizedValue === "string" &&
      reservationDocumentId(kind, current.normalizedValue) === snapshot.id;
    if (!structurallyValid) {
      increment(issues, "conflictingLocks");
      continue;
    }
    planned.groups.push({
      kind: "staleLockDeletes",
      writes: [deleteWrite(snapshot)],
    });
    increment(planned.counts, "staleLockDeletes");
  }
}

function blockingIssueCount(issues) {
  return Object.values(issues).reduce((total, value) => total + value, 0);
}

function printPreflight(stats, issues, planned, apply) {
  console.log(apply ? "Modo: APPLY autorizado." : "Modo: DRY-RUN (sem escritas).");
  console.log("Preflight concluido sem exibir nomes, codigos ou documentos.");
  console.log(
    "O saldo atual sera o baseline; movimentos anteriores nao serao tratados como historico autoritativo.",
  );
  console.log(`Categorias verificadas: ${stats.categories}.`);
  console.log(`Produtos verificados: ${stats.products}.`);
  console.log(`Locks verificados: ${stats.locks}.`);

  const issueLabels = {
    activeCategoryCollisions: "Colisoes entre categorias ativas",
    activeProductBarcodeCollisions: "Colisoes de barcode entre produtos ativos",
    activeProductNameCollisions: "Colisoes de nome entre produtos ativos",
    archivedProductStock: "Produtos arquivados com saldo diferente de zero",
    categoryIdConflicts: "Conflitos de ID canonico de categoria",
    conflictingLocks: "Locks existentes conflitantes ou invalidos",
    inactiveCategoryReferences: "Produtos ativos sem categoria ativa",
    invalidCategories: "Categorias com dados invalidos",
    invalidProducts: "Produtos com dados invalidos",
    lockHashConflicts: "Colisoes de hash de lock",
    missingCategoryReferences: "Produtos com categoria ausente",
  };
  for (const [key, label] of Object.entries(issueLabels)) {
    console.log(`${label}: ${issues[key] || 0}.`);
  }

  const plannedWrites = planned.groups.reduce(
    (total, group) => total + group.writes.length,
    0,
  );
  console.log(`Grupos atomicos planejados: ${planned.groups.length}.`);
  console.log(`Escritas de dados planejadas: ${plannedWrites}.`);
  for (const key of [
    "categoryMoves",
    "categoryUpdates",
    "productUpdates",
    "lockCreates",
    "lockUpdates",
    "staleLockDeletes",
  ]) {
    console.log(`${key}: ${planned.counts[key] || 0}.`);
  }
}

function addWriteToBatch(batch, write) {
  if (write.type === "create") {
    batch.create(write.ref, write.data);
  } else if (write.type === "update") {
    batch.update(write.ref, write.data, write.precondition);
  } else if (write.type === "delete") {
    batch.delete(write.ref, write.precondition);
  } else {
    throw new CliError("Tipo interno de escrita desconhecido.");
  }
}

function markerLeaseIsOwned(marker, runId) {
  return marker.completed === false && marker.runId === runId;
}

async function acquireMigrationLease(
  db,
  markerRef,
  runId,
  initialPlan,
  Timestamp,
  FieldValue,
) {
  const nowMs = Date.now();
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(markerRef);
    const marker = snapshot.exists ? snapshot.data() : {};
    if (
      Number.isInteger(marker.schemaVersion) &&
      marker.schemaVersion > SCHEMA_VERSION
    ) {
      throw new CliError("Workspace usa schema de seguranca mais recente.");
    }
    if (
      marker.completed === true &&
      marker.schemaVersion === SCHEMA_VERSION &&
      marker.inventoryBaselineAccepted === true
    ) {
      if (initialPlan.planned.groups.length === 0) return "complete";
      throw new CliError(
        "Workspace concluido sofreu drift; investigue antes de remigrar.",
      );
    }

    const leaseExpiresAt = marker.leaseExpiresAt?.toMillis?.() || 0;
    if (
      marker.completed === false &&
      typeof marker.runId === "string" &&
      marker.runId !== runId &&
      leaseExpiresAt > nowMs
    ) {
      throw new CliError("Outra migracao possui lease ativo para o workspace.");
    }

    transaction.set(markerRef, {
      completed: false,
      inventoryBaselineAccepted: false,
      leaseExpiresAt: Timestamp.fromMillis(nowMs + MIGRATION_LEASE_MS),
      migrationActor: MIGRATION_ACTOR,
      runId,
      schemaVersion: SCHEMA_VERSION,
      startedAt: FieldValue.serverTimestamp(),
    });
    return "acquired";
  });
}

async function commitGroups(
  db,
  groups,
  markerRef,
  runId,
  Timestamp,
  FieldValue,
) {
  let batch = db.batch();
  let batchWrites = 0;
  let committedBatches = 0;

  async function commitCurrentBatch() {
    if (batchWrites === 0) return;
    const markerSnapshot = await markerRef.get();
    const marker = markerSnapshot.exists ? markerSnapshot.data() : {};
    if (!markerSnapshot.exists || !markerLeaseIsOwned(marker, runId)) {
      throw new CliError("Lease da migracao foi perdido antes do batch.");
    }
    batch.update(
      markerRef,
      {
        heartbeatAt: FieldValue.serverTimestamp(),
        leaseExpiresAt: Timestamp.fromMillis(Date.now() + MIGRATION_LEASE_MS),
      },
      { lastUpdateTime: markerSnapshot.updateTime },
    );
    await batch.commit();
    committedBatches += 1;
    batch = db.batch();
    batchWrites = 0;
  }

  for (const group of groups) {
    if (group.writes.length > MAX_BATCH_WRITES) {
      throw new CliError("Grupo atomico excede o limite seguro de batch.");
    }
    if (batchWrites + group.writes.length > MAX_BATCH_WRITES) {
      await commitCurrentBatch();
    }
    for (const write of group.writes) addWriteToBatch(batch, write);
    batchWrites += group.writes.length;
  }
  await commitCurrentBatch();
  return committedBatches;
}

async function collectWorkspacePlan(
  {
    barcodeLocksRef,
    categoriesRef,
    nameLocksRef,
    productsRef,
    workspaceRoot,
  },
  FieldPath,
  FieldValue,
) {
  const readBudget = { aborted: false, bytes: 0 };
  const [
    categorySnapshots,
    productSnapshots,
    nameLockSnapshots,
    barcodeLockSnapshots,
  ] = await Promise.all([
    readPaginated(
      categoriesRef,
      FieldPath,
      readBudget,
      "categories",
      MAX_MIGRATION_COLLECTION_DOCUMENTS,
    ),
    readPaginated(
      productsRef,
      FieldPath,
      readBudget,
      "products",
      MAX_MIGRATION_COLLECTION_DOCUMENTS,
    ),
    readPaginated(
      nameLocksRef,
      FieldPath,
      readBudget,
      "productNameLocks",
      MAX_MIGRATION_LOCK_DOCUMENTS,
    ),
    readPaginated(
      barcodeLocksRef,
      FieldPath,
      readBudget,
      "productBarcodeLocks",
      MAX_MIGRATION_LOCK_DOCUMENTS,
    ),
  ]);

  const issues = {};
  const planned = { counts: {}, groups: [] };
  const categories = parseCategories(categorySnapshots, issues);
  const products = parseProducts(productSnapshots, issues);
  const { categoriesById } = analyzeDomain(categories, products, issues);

  planDocumentUpdates(
    workspaceRoot,
    categories,
    products,
    categoriesById,
    FieldValue,
    planned,
  );

  const expectedLocks = buildExpectedLocks(products, issues);
  analyzeLockCollection(
    "productNameLocks",
    nameLocksRef,
    nameLockSnapshots,
    expectedLocks.names,
    FieldValue,
    issues,
    planned,
  );
  analyzeLockCollection(
    "productBarcodeLocks",
    barcodeLocksRef,
    barcodeLockSnapshots,
    expectedLocks.barcodes,
    FieldValue,
    issues,
    planned,
  );

  return {
    issues,
    planned,
    stats: {
      categories: categorySnapshots.length,
      locks: nameLockSnapshots.length + barcodeLockSnapshots.length,
      products: productSnapshots.length,
    },
  };
}

async function applyPlan(
  db,
  markerRef,
  initialPlan,
  Timestamp,
  FieldValue,
  verifyFinalState,
) {
  const runId = crypto.randomUUID();
  let leaseAcquired = false;
  try {
    const leaseState = await acquireMigrationLease(
      db,
      markerRef,
      runId,
      initialPlan,
      Timestamp,
      FieldValue,
    );
    if (leaseState === "complete") {
      console.log("Workspace ja esta migrado e consistente; nenhuma escrita feita.");
      return;
    }
    leaseAcquired = true;

    const committedBatches = await commitGroups(
      db,
      initialPlan.planned.groups,
      markerRef,
      runId,
      Timestamp,
      FieldValue,
    );
    const finalPlan = await verifyFinalState();
    if (
      blockingIssueCount(finalPlan.issues) > 0 ||
      finalPlan.planned.groups.length > 0
    ) {
      throw new CliError(
        "Verificacao final inconsistente; o marcador nao sera criado.",
      );
    }
    await db.runTransaction(async (transaction) => {
      const markerSnapshot = await transaction.get(markerRef);
      const marker = markerSnapshot.exists ? markerSnapshot.data() : {};
      if (!markerSnapshot.exists || !markerLeaseIsOwned(marker, runId)) {
        throw new CliError("Lease da migracao foi perdido antes da conclusao.");
      }
      transaction.set(markerRef, {
        completed: true,
        completedAt: FieldValue.serverTimestamp(),
        inventoryBaselineAccepted: true,
        inventoryHistoryBeforeMigrationAuthoritative: false,
        migrationActor: MIGRATION_ACTOR,
        schemaVersion: SCHEMA_VERSION,
        stats: {
          categories: finalPlan.stats.categories,
          dataWriteGroups: initialPlan.planned.groups.length,
          locks: finalPlan.stats.locks,
          products: finalPlan.stats.products,
        },
      });
    });
    console.log(`Aplicacao concluida em ${committedBatches} batch(es) de dados.`);
    console.log("Marcador de seguranca criado somente apos todas as escritas.");
  } catch (error) {
    if (leaseAcquired) {
      try {
        await db.runTransaction(async (transaction) => {
          const markerSnapshot = await transaction.get(markerRef);
          const marker = markerSnapshot.exists ? markerSnapshot.data() : {};
          if (markerSnapshot.exists && markerLeaseIsOwned(marker, runId)) {
            transaction.delete(markerRef);
          }
        });
      } catch {
        // O lease expira e permite retomada sem apagar o estado de outro run.
      }
    }
    throw error;
  }
}

async function execute(options) {
  // Carregamento tardio: --help funciona mesmo antes de npm ci em functions/.
  const {
    applicationDefault,
    deleteApp,
    initializeApp,
  } = require("firebase-admin/app");
  const {
    FieldPath,
    FieldValue,
    Timestamp,
    getFirestore,
  } = require("firebase-admin/firestore");

  const localEmulator = usingLocalEmulator(options.projectId);
  const appOptions = { projectId: options.projectId };
  if (!localEmulator) {
    appOptions.credential = applicationDefault();
  }
  const app = initializeApp(appOptions);

  try {
    const db = getFirestore(app);
    const workspaceRoot = db.collection("users").doc(options.workspaceId);
    const categoriesRef = workspaceRoot.collection("categories");
    const productsRef = workspaceRoot.collection("products");
    const uniquenessRef = workspaceRoot
      .collection("_security")
      .doc("uniqueness");
    const nameLocksRef = uniquenessRef.collection("productNameLocks");
    const barcodeLocksRef = uniquenessRef.collection("productBarcodeLocks");
    const markerRef = workspaceRoot.collection("_security").doc("migration");
    const references = {
      barcodeLocksRef,
      categoriesRef,
      nameLocksRef,
      productsRef,
      workspaceRoot,
    };
    const [initialPlan, markerSnapshot, workspaceSnapshot] = await Promise.all([
      collectWorkspacePlan(references, FieldPath, FieldValue),
      markerRef.get(),
      workspaceRoot.get(),
    ]);
    if (!workspaceSnapshot.exists) {
      throw new CliError("Workspace raiz nao existe; confira project e workspace.");
    }
    const marker = markerSnapshot.exists ? markerSnapshot.data() : {};
    if (
      Number.isInteger(marker.schemaVersion) &&
      marker.schemaVersion > SCHEMA_VERSION
    ) {
      throw new CliError("Workspace usa schema de seguranca mais recente.");
    }
    printPreflight(
      initialPlan.stats,
      initialPlan.issues,
      initialPlan.planned,
      options.apply,
    );

    if (blockingIssueCount(initialPlan.issues) > 0) {
      throw new CliError(
        "Preflight bloqueado. Corrija os conflitos agregados antes de aplicar.",
      );
    }
    if (!options.apply) {
      console.log("Dry-run finalizado. Nenhuma escrita foi executada.");
      return;
    }

    await applyPlan(
      db,
      markerRef,
      initialPlan,
      Timestamp,
      FieldValue,
      () => collectWorkspacePlan(references, FieldPath, FieldValue),
    );
  } finally {
    await deleteApp(app);
  }
}

function safeOperationalMessage(error) {
  if (error instanceof CliError) return error.safeMessage;
  const code =
    typeof error?.code === "string" && /^[A-Za-z0-9_./-]{1,80}$/u.test(error.code)
      ? ` Codigo: ${error.code}.`
      : "";
  return `Falha operacional durante a migracao.${code} Nenhum dado foi exibido.`;
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
