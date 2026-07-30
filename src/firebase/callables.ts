import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./firebase";

type MovementType = "add" | "remove";

export interface CreateProductInput {
  name: string;
  category: string;
  quantity: number;
  cost: number;
  unitPrice: number;
  image?: string | null;
  minStock: number;
  barcode: string;
  date: string;
}

export interface AdjustStockInput {
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  cost?: number;
  unitPrice?: number;
}

export interface ProductChanges {
  name?: string;
  category?: string;
  minStock?: number;
  barcode?: string;
}

interface PendingRequest {
  requestId: string;
  createdAt: number;
}

const REQUEST_STORAGE_PREFIX = "mystoreday:idempotency:v2:";
const IDEMPOTENCY_RETRY_WINDOW_MS = 6 * 24 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const pendingRequests = new Map<string, PendingRequest>();
const inFlightCalls = new Map<string, Promise<unknown>>();
const requestIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

const stableSerialize = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
    .join(",")}}`;
};

const sha256Hex = async (value: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

const operationStorageKey = async (operation: string, input: unknown) => {
  const actorUid = auth.currentUser?.uid ?? "anonymous";
  const fingerprint = await sha256Hex(
    stableSerialize({ actorUid, input, operation }),
  );
  return `${REQUEST_STORAGE_PREFIX}${fingerprint}`;
};

const isPendingRequest = (value: unknown): value is PendingRequest => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).sort().join(",") === "createdAt,requestId" &&
    typeof record.requestId === "string" &&
    requestIdPattern.test(record.requestId) &&
    typeof record.createdAt === "number" &&
    Number.isSafeInteger(record.createdAt) &&
    record.createdAt > 0
  );
};

const assertRetryWindow = (pending: PendingRequest) => {
  const age = Date.now() - pending.createdAt;
  if (age < -MAX_CLOCK_SKEW_MS || age >= IDEMPOTENCY_RETRY_WINDOW_MS) {
    throw new Error(
      "Existe uma operacao antiga sem confirmacao. Atualize os dados e confirme o estado antes de tentar novamente.",
    );
  }
};

const readPendingRequest = (storageKey: string) => {
  const inMemory = pendingRequests.get(storageKey);
  if (inMemory) {
    assertRetryWindow(inMemory);
    return inMemory;
  }
  let stored: string | null;
  try {
    stored = window.localStorage.getItem(storageKey);
  } catch {
    // O fallback em memoria preserva idempotencia enquanto a pagina estiver aberta.
    return null;
  }
  if (!stored) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
  if (!isPendingRequest(parsed)) {
    window.localStorage.removeItem(storageKey);
    return null;
  }
  assertRetryWindow(parsed);
  pendingRequests.set(storageKey, parsed);
  return parsed;
};

const persistPendingRequest = (
  storageKey: string,
  pendingRequest: PendingRequest,
) => {
  pendingRequests.set(storageKey, pendingRequest);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(pendingRequest));
  } catch {
    // Storage pode estar indisponivel em modo privado; o Map continua valido.
  }
};

const clearPendingRequestId = (storageKey: string, requestId: string) => {
  if (pendingRequests.get(storageKey)?.requestId === requestId) {
    pendingRequests.delete(storageKey);
  }
  try {
    const stored = window.localStorage.getItem(storageKey);
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    if (isPendingRequest(parsed) && parsed.requestId === requestId) {
      window.localStorage.removeItem(storageKey);
    }
  } catch {
    // Nada a limpar quando o storage esta indisponivel.
  }
};

const callIdempotently = async <Input extends object, Output>(
  operation: string,
  input: Input,
  invoke: (payload: Input & { requestId: string }) => Promise<Output>,
) => {
  const storageKey = await operationStorageKey(operation, input);
  const existingCall = inFlightCalls.get(storageKey);
  if (existingCall) return existingCall as Promise<Output>;

  const pendingRequest = readPendingRequest(storageKey) ?? {
    requestId: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  persistPendingRequest(storageKey, pendingRequest);
  const call = (async () => {
    const output = await invoke({ ...input, requestId: pendingRequest.requestId });
    clearPendingRequestId(storageKey, pendingRequest.requestId);
    return output;
  })();
  inFlightCalls.set(storageKey, call);
  try {
    return await call;
  } finally {
    if (inFlightCalls.get(storageKey) === call) {
      inFlightCalls.delete(storageKey);
    }
  }
};

const createProductCallable = httpsCallable<
  CreateProductInput & { requestId: string },
  { productId: string }
>(functions, "createProduct", { limitedUseAppCheckTokens: true });

const adjustStockCallable = httpsCallable<
  AdjustStockInput & { requestId: string },
  { quantity: number }
>(functions, "adjustStock", { limitedUseAppCheckTokens: true });

const updateProductCallable = httpsCallable<
  { productId: string; changes: ProductChanges; requestId: string },
  { success: true }
>(functions, "updateProduct", { limitedUseAppCheckTokens: true });

const archiveProductCallable = httpsCallable<
  { productId: string; requestId: string },
  { success: true }
>(functions, "archiveProduct", { limitedUseAppCheckTokens: true });

const createCategoryCallable = httpsCallable<
  { name: string; requestId: string },
  { categoryId: string }
>(functions, "createCategory", { limitedUseAppCheckTokens: true });

const deleteCategoryCallable = httpsCallable<
  { name: string; requestId: string },
  { success: true }
>(functions, "deleteCategory", { limitedUseAppCheckTokens: true });

export const createProduct = async (input: CreateProductInput) => {
  const response = await callIdempotently("createProduct", input, (payload) =>
    createProductCallable(payload),
  );
  return response.data.productId;
};

export const adjustStock = async (input: AdjustStockInput) => {
  const response = await callIdempotently("adjustStock", input, (payload) =>
    adjustStockCallable(payload),
  );
  return response.data.quantity;
};

export const updateProduct = async (
  productId: string,
  changes: ProductChanges,
) => {
  const input = { productId, changes };
  await callIdempotently("updateProduct", input, (payload) =>
    updateProductCallable(payload),
  );
};

export const archiveProduct = async (productId: string) => {
  const input = { productId };
  await callIdempotently("archiveProduct", input, (payload) =>
    archiveProductCallable(payload),
  );
};

export const createCategory = async (name: string) => {
  const input = { name };
  const response = await callIdempotently("createCategory", input, (payload) =>
    createCategoryCallable(payload),
  );
  return response.data.categoryId;
};

export const deleteCategory = async (name: string) => {
  const input = { name };
  await callIdempotently("deleteCategory", input, (payload) =>
    deleteCategoryCallable(payload),
  );
};
