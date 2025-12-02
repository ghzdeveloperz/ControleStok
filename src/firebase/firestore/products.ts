// src/firebase/firestore/products.ts

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  DocumentData,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

// ------------------------------------------------------
// TIPAGENS
// ------------------------------------------------------

export interface ProductQuantity {
  id: string;
  quantity: number;
  cost?: number;
  unitPrice?: number;
  name: string;
  category?: string;
  image?: string | null;
  minStock?: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  cost: number;
  type: "add" | "remove";
  date: string;
}

// ------------------------------------------------------
// COLLECTIONS
// ------------------------------------------------------

const quantitiesRef = collection(db, "quantities");
const movementsRef = collection(db, "movements");
const categoriesRef = collection(db, "categories");

// ------------------------------------------------------
// LISTENER OFICIAL (real-time update)
// ------------------------------------------------------

export const onProductsUpdate = (callback: (products: ProductQuantity[]) => void) => {
  return onSnapshot(quantitiesRef, (snapshot) => {
    const products = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as DocumentData;

      return {
        id: docSnap.id,
        quantity: Number(data.quantity ?? 0),
        cost: Number(data.cost ?? 0),
        unitPrice: Number(data.unitPrice ?? data.cost ?? 0),
        name: String(data.name ?? "Sem nome"),
        category: String(data.category ?? "Sem categoria"),
        image: data.image ?? null,
        minStock: Number(data.minStock ?? 0),
      };
    });

    callback(products);
  });
};

// ------------------------------------------------------
// GET PRODUCTS
// ------------------------------------------------------

export const getProducts = async (): Promise<ProductQuantity[]> => {
  const snapshot = await getDocs(quantitiesRef);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DocumentData;

    return {
      id: docSnap.id,
      quantity: Number(data.quantity ?? 0),
      cost: Number(data.cost ?? 0),
      unitPrice: Number(data.unitPrice ?? data.cost ?? 0),
      name: String(data.name ?? "Sem nome"),
      category: String(data.category ?? "Sem categoria"),
      image: data.image ?? null,
      minStock: Number(data.minStock ?? 0),
    };
  });
};

// ------------------------------------------------------
// SALVAR NOVO PRODUTO
// ------------------------------------------------------

export const saveProduct = async (product: Omit<ProductQuantity, "id">) => {
  const docRef = await addDoc(quantitiesRef, product);
  return { ...product, id: docRef.id };
};

// ------------------------------------------------------
// REMOVER TODOS OS MOVIMENTOS DO PRODUTO
// ------------------------------------------------------

export const removeProductMovements = async (productId: string) => {
  const q = query(movementsRef, where("productId", "==", productId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  snapshot.docs.forEach((movement) => {
    batch.delete(doc(db, "movements", movement.id));
  });

  await batch.commit();
};

// ------------------------------------------------------
// REMOVER PRODUTO COMPLETO
// ------------------------------------------------------

export const removeProduct = async (id: string) => {
  await removeProductMovements(id);
  await deleteDoc(doc(db, "quantities", id));
};

// ------------------------------------------------------
// ★★★ SALVAR MOVIMENTO (VERSÃO FINAL — SEM BLOQUEIO) ★★★
// ------------------------------------------------------

export const saveMovement = async (
  data: Omit<StockMovement, "id">
): Promise<StockMovement> => {

  const convertedDate = new Date(data.date + "T00:00:00");

  const movementDocRef = await addDoc(movementsRef, {
    ...data,
    timestamp: serverTimestamp(),
    realDate: convertedDate,
    day: data.date
  });

  const productRef = doc(db, "quantities", data.productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) throw new Error("Produto não encontrado.");

  const prod = productSnap.data() as DocumentData;

  const newQuantity =
    data.type === "add"
      ? Number(prod.quantity ?? 0) + data.quantity
      : Number(prod.quantity ?? 0) - data.quantity;

  await updateDoc(productRef, {
    quantity: newQuantity,
    cost: data.cost,
    unitPrice: data.price,
  });

  return { ...data, id: movementDocRef.id };
};

// ------------------------------------------------------
// ENTRADA DE PRODUTO
// ------------------------------------------------------

export const addProductToStock = async (
  productId: string,
  productName: string,
  quantity: number,
  cost: number,
  unitPrice: number,
  date?: string
) => {
  const movementDate = date ?? new Date().toISOString().split("T")[0];

  return await saveMovement({
    productId,
    productName,
    quantity,
    cost,
    price: unitPrice,
    type: "add",
    date: movementDate,
  });
};

// ------------------------------------------------------
// LISTAR MOVIMENTOS
// ------------------------------------------------------

export const getAllMovements = async (): Promise<StockMovement[]> => {
  const snapshot = await getDocs(movementsRef);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DocumentData;
    return {
      id: docSnap.id,
      productId: data.productId,
      productName: data.productName,
      quantity: data.quantity,
      price: data.price,
      cost: data.cost,
      type: data.type,
      date: data.date,
    };
  });
};

// ======================================================
// CATEGORIAS — COMPLETO
// ======================================================

export const saveCategory = async (name: string) => {
  const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  await addDoc(categoriesRef, { name: formatted });
};

export const getCategories = async (): Promise<string[]> => {
  const snapshot = await getDocs(categoriesRef);
  return snapshot.docs.map((doc) => doc.data().name as string);
};

export const onCategoriesUpdate = (callback: (categories: string[]) => void) => {
  return onSnapshot(categoriesRef, (snapshot) => {
    callback(snapshot.docs.map((doc) => doc.data().name as string));
  });
};

export const categoryHasProducts = async (category: string): Promise<boolean> => {
  const q = query(quantitiesRef, where("category", "==", category));
  const snap = await getDocs(q);
  return !snap.empty;
};

export const deleteCategory = async (name: string) => {
  const q = query(categoriesRef, where("name", "==", name));
  const snap = await getDocs(q);

  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
};

// ------------------------------------------------------
// FETCH DIRETO DE PRODUTOS
// ------------------------------------------------------

export const fetchProducts = async (): Promise<ProductQuantity[]> => {
  try {
    const snapshot = await getDocs(quantitiesRef);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as DocumentData;
      return {
        id: docSnap.id,
        quantity: Number(data.quantity ?? 0),
        cost: Number(data.cost ?? 0),
        unitPrice: Number(data.unitPrice ?? data.cost ?? 0),
        name: String(data.name ?? "Sem nome"),
        category: String(data.category ?? "Sem categoria"),
        image: data.image ?? null,
        minStock: Number(data.minStock ?? 0),
      };
    });
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return [];
  }
};

// ------------------------------------------------------
// VERIFICAR SE PRODUTO JÁ EXISTE POR NOME
// ------------------------------------------------------
export const productExists = async (name: string): Promise<boolean> => {
  const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  const q = query(quantitiesRef, where("name", "==", formatted));
  const snap = await getDocs(q);
  return !snap.empty;
};
