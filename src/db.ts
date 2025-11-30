// src/db.ts

// ----------------------------------------------
// TIPAGENS
// ----------------------------------------------

export interface ProductQuantity {
  id: number | string;
  quantity: number;
  cost?: number;      // custo médio
  unitPrice?: number; // preço unitário definido no modal
}

export interface StockMovement {
  id: string;
  productId: number | string;
  productName: string;
  quantity: number;
  price: number; // preço informado no modal (unitário)
  cost: number;  // custo registrado (custo médio)
  type: "add" | "remove";
  date: string;  // formato yyyy-mm-dd
}

// ----------------------------------------------
// CONFIGURAÇÕES DO BANCO
// ----------------------------------------------

const DB_NAME = "estoqueDB";
const DB_VERSION = 3;
const STORE_QUANTITIES = "quantities";
const STORE_MOVEMENTS = "movements";

let db: IDBDatabase | null = null;

// ----------------------------------------------
// INICIALIZAÇÃO
// ----------------------------------------------

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve();

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Erro ao abrir o banco de dados");

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORE_QUANTITIES)) {
        database.createObjectStore(STORE_QUANTITIES, { keyPath: "id" });
      }

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

// ----------------------------------------------
// RESET TOTAL DO BANCO
// ----------------------------------------------

export const resetDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close();
      db = null;
    }

    const req = indexedDB.deleteDatabase(DB_NAME);

    req.onsuccess = () => resolve();
    req.onerror = () => reject("Erro ao deletar banco");
    req.onblocked = () => console.warn("Exclusão bloqueada");
  });
};

// ----------------------------------------------
// LIMPAR APENAS TABELAS
// ----------------------------------------------

export const clearDB = async (): Promise<void> => {
  if (!db) await initDB();
  if (!db) throw new Error("Banco não inicializado");

  const tx = db.transaction([STORE_QUANTITIES, STORE_MOVEMENTS], "readwrite");
  tx.objectStore(STORE_QUANTITIES).clear();
  tx.objectStore(STORE_MOVEMENTS).clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Erro ao limpar as stores");
  });
};

// ----------------------------------------------
// CRUD – QUANTIDADES
// ----------------------------------------------

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

    const req = store.getAll();

    req.onsuccess = () => resolve(req.result as ProductQuantity[]);
    req.onerror = () => reject("Erro ao recuperar produtos");
  });
};

// Função de compatibilidade
export const getProducts = async (): Promise<ProductQuantity[]> => {
  return await getProductsQuantities();
};

// ----------------------------------------------
// MOVIMENTOS
// ----------------------------------------------

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const saveMovement = (
  movement: Omit<StockMovement, "id">
): Promise<StockMovement> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("DB não inicializado");

    try {
      const tx = db.transaction([STORE_MOVEMENTS, STORE_QUANTITIES], "readwrite");
      const movementsStore = tx.objectStore(STORE_MOVEMENTS);
      const quantitiesStore = tx.objectStore(STORE_QUANTITIES);

      // Salva a movimentação
      const toSave: StockMovement = { ...movement, id: makeId() };
      movementsStore.put(toSave);

      // Atualiza produto no estoque
      const getReq = quantitiesStore.get(movement.productId);
      getReq.onsuccess = () => {
        const prod = getReq.result as ProductQuantity;
        if (prod) {
          if (movement.type === "add") {
            prod.quantity += movement.quantity;
            prod.cost = movement.cost;       // usa custo médio calculado
            prod.unitPrice = movement.price; // preço unitário definido no modal
          } else if (movement.type === "remove") {
            prod.quantity -= movement.quantity;
          }
          quantitiesStore.put(prod);
        }
      };

      tx.oncomplete = () => resolve(toSave);
      tx.onerror = () => reject("Erro ao salvar movimentação");
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

export const getMovementsByMonth = (
  month: number,
  year: number
): Promise<StockMovement[]> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("DB não inicializado");

    const tx = db.transaction(STORE_MOVEMENTS, "readonly");
    const store = tx.objectStore(STORE_MOVEMENTS);

    const req = store.getAll();

    req.onsuccess = () => {
      const all = req.result as StockMovement[];
      const filtered = all.filter((m) => {
        const [y, mm] = (m.date || "").split("-").map(Number);
        return y === year && mm === month;
      });
      resolve(filtered);
    };

    req.onerror = () => reject("Erro ao recuperar movimentos por mês");
  });
};

export const getAvailableMonths = (): Promise<{ month: number; year: number }[]> =>
  new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("DB não inicializado");

    const tx = db.transaction(STORE_MOVEMENTS, "readonly");
    const store = tx.objectStore(STORE_MOVEMENTS);

    const req = store.getAll();

    req.onsuccess = () => {
      const all = req.result as StockMovement[];
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
