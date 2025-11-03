// src/db.ts
export interface ProductQuantity {
  id: number | string;
  quantity: number;
}

const DB_NAME = "estoqueDB";
const DB_VERSION = 1;
const STORE_NAME = "quantities";

let db: IDBDatabase | null = null;

// Inicializa IndexedDB
export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(); // já inicializado

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject("Erro ao abrir o banco de dados");
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve();
    };
  });
};

// Salva quantidades (apenas)
export const saveProducts = (products: ProductQuantity[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("Banco não inicializado");

    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    products.forEach((p) => store.put(p));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Erro ao salvar produtos");
  });
};

// Recupera quantidades salvas
export const getProductsQuantities = (): Promise<ProductQuantity[]> => {
  return new Promise(async (resolve, reject) => {
    if (!db) await initDB();
    if (!db) return reject("Banco não inicializado");

    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as ProductQuantity[]);
    request.onerror = () => reject("Erro ao recuperar produtos");
  });
};
