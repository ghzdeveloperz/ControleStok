// src/db.ts
export interface ProductQuantity {
  id: number | string;
  quantity: number;
}

export interface StockMovement {
  id: string; // unique id
  productId: number | string;
  productName: string;
  quantity: number;
  type: "add" | "remove";
  date: string; // YYYY-MM-DD
}

const DB_NAME = "estoqueDB";
const DB_VERSION = 2; // bumped for movements store
const STORE_QUANTITIES = "quantities";
const STORE_MOVEMENTS = "movements";

let db: IDBDatabase | null = null;

// -----------------------------
// INIT DB
// -----------------------------
export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve();

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Erro ao abrir o banco de dados");

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // create quantities store if doesn't exist
      if (!database.objectStoreNames.contains(STORE_QUANTITIES)) {
        database.createObjectStore(STORE_QUANTITIES, { keyPath: "id" });
      }

      // create movements store if doesn't exist and add an index on date
      if (!database.objectStoreNames.contains(STORE_MOVEMENTS)) {
        const store = database.createObjectStore(STORE_MOVEMENTS, { keyPath: "id" });
        store.createIndex("by_date", "date", { unique: false });
        store.createIndex("by_productId", "productId", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve();
    };
  });
};

// -----------------------------
// RESET / CLEAR DB
// -----------------------------
export const resetDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close();
      db = null;
    }

    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () => reject("Erro ao deletar banco de dados");
    deleteRequest.onblocked = () => console.warn("Exclusão do banco bloqueada");
  });
};

export const clearDB = async (): Promise<void> => {
  if (!db) await initDB();
  if (!db) throw new Error("Banco não inicializado");

  const tx = db.transaction([STORE_QUANTITIES, STORE_MOVEMENTS], "readwrite");
  tx.objectStore(STORE_QUANTITIES).clear();
  tx.objectStore(STORE_MOVEMENTS).clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Erro ao limpar stores");
  });
};

// -----------------------------
// Quantities helpers
// -----------------------------
export const saveProducts = (products: ProductQuantity[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("Banco não inicializado");

    const tx = db.transaction(STORE_QUANTITIES, "readwrite");
    const store = tx.objectStore(STORE_QUANTITIES);

    products.forEach((p) => store.put(p));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Erro ao salvar produtos");
  });
};

export const getProductsQuantities = (): Promise<ProductQuantity[]> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("Banco não inicializado");

    const tx = db.transaction(STORE_QUANTITIES, "readonly");
    const store = tx.objectStore(STORE_QUANTITIES);

    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as ProductQuantity[]);
    request.onerror = () => reject("Erro ao recuperar produtos");
  });
};

// -----------------------------
// Movements helpers
// -----------------------------
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const saveMovement = (movement: Omit<StockMovement, "id">): Promise<StockMovement> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("DB não inicializado");

    try {
      const tx = db.transaction(STORE_MOVEMENTS, "readwrite");
      const store = tx.objectStore(STORE_MOVEMENTS);

      const toSave: StockMovement = { ...movement, id: makeId() };
      const req = store.put(toSave);

      req.onsuccess = () => resolve(toSave);
      req.onerror = () => reject("Erro ao salvar movimentação");
    } catch (err) {
      reject(err);
    }
  });
};

export const getAllMovements = (): Promise<StockMovement[]> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("DB não inicializado");

    const tx = db.transaction(STORE_MOVEMENTS, "readonly");
    const store = tx.objectStore(STORE_MOVEMENTS);

    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as StockMovement[]);
    req.onerror = () => reject("Erro ao recuperar movimentos");
  });
};

export const getMovementsByMonth = (month: number, year: number): Promise<StockMovement[]> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("DB não inicializado");

    const tx = db.transaction(STORE_MOVEMENTS, "readonly");
    const store = tx.objectStore(STORE_MOVEMENTS);

    const req = store.getAll();
    req.onsuccess = () => {
      const all: StockMovement[] = req.result as StockMovement[];
      const filtered = all.filter((m) => {
        const parts = (m.date || "").split("-");
        if (parts.length < 3) return false;
        const [y, mth] = parts.map(Number);
        return y === year && mth === month;
      });
      resolve(filtered);
    };
    req.onerror = () => reject("Erro ao recuperar movimentos por mês");
  });
};

export const getAvailableMonths = (): Promise<{ month: number; year: number }[]> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("DB não inicializado");

    const tx = db.transaction(STORE_MOVEMENTS, "readonly");
    const store = tx.objectStore(STORE_MOVEMENTS);

    const req = store.getAll();
    req.onsuccess = () => {
      const all: StockMovement[] = req.result as StockMovement[];
      const map = new Map<string, { month: number; year: number }>();
      all.forEach((m) => {
        const parts = (m.date || "").split("-");
        if (parts.length < 2) return;
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        if (!year || !month) return;
        const key = `${year}-${month}`;
        if (!map.has(key)) map.set(key, { month, year });
      });
      const arr = Array.from(map.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      resolve(arr);
    };
    req.onerror = () => reject("Erro ao recuperar meses disponíveis");
  });
};
