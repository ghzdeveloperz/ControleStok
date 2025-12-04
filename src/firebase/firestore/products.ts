// src/firebase/firestore/products.ts

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  DocumentData,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { StockMovement } from "./movements";

// ------------------------------------------------------
// TIPOS
// ------------------------------------------------------

export interface ProductQuantity {
  id: string;
  name: string;
  category: string;

  quantity: number;

  cost?: number;
  unitPrice: number;

  price?: number;

  image?: string | null;
  minStock: number;
}

// ------------------------------------------------------
// LISTENER GLOBAL
// ------------------------------------------------------

export const onProductsUpdate = (
  callback: (products: ProductQuantity[]) => void
) => {
  const ref = collection(db, "quantities");

  return onSnapshot(ref, (snapshot) => {
    const list = snapshot.docs.map((docSnap) => {
      const d = docSnap.data() as DocumentData;

      return {
        id: docSnap.id,
        name: d.name ?? "Sem nome",
        quantity: Number(d.quantity ?? 0),
        cost: Number(d.cost ?? 0),
        unitPrice: Number(d.unitPrice ?? 0),
        price: Number(d.price ?? d.cost ?? d.unitPrice ?? 0),
        category: d.category ?? "Sem categoria",
        image: d.image ?? null,
        minStock: Number(d.minStock ?? 0),
      };
    });

    callback(list);
  });
};

// ------------------------------------------------------
// LISTENER POR USUÁRIO
// ------------------------------------------------------

export const onProductsUpdateForUser = (
  userId: string,
  callback: (products: ProductQuantity[]) => void
) => {
  const ref = collection(db, "users", userId, "products");

  return onSnapshot(ref, (snapshot) => {
    const list = snapshot.docs.map((docSnap) => {
      const d = docSnap.data() as DocumentData;

      return {
        id: docSnap.id,
        name: d.name ?? "Produto sem nome",
        quantity: Number(d.quantity ?? 0),
        cost: Number(d.cost ?? 0),
        unitPrice: Number(d.unitPrice ?? 0),
        price: Number(d.price ?? d.cost ?? d.unitPrice ?? 0),
        category: d.category ?? "Sem categoria",
        image: d.image ?? null,
        minStock: Number(d.minStock ?? 0),
      };
    });

    callback(list);
  });
};

// ------------------------------------------------------
// GET PRODUCTS
// ------------------------------------------------------

export const getProductsForUser = async (
  userId: string
): Promise<ProductQuantity[]> => {
  const ref = collection(db, "users", userId, "products");
  const snapshot = await getDocs(ref);

  return snapshot.docs.map((docSnap) => {
    const d = docSnap.data() as DocumentData;

    return {
      id: docSnap.id,
      name: d.name,
      quantity: Number(d.quantity ?? 0),
      cost: Number(d.cost ?? 0),
      unitPrice: Number(d.unitPrice ?? 0),
      price: Number(d.price ?? d.cost ?? d.unitPrice ?? 0),
      category: d.category ?? "Sem categoria",
      image: d.image ?? null,
      minStock: Number(d.minStock ?? 0),
    };
  });
};

// ------------------------------------------------------
// SALVAR PRODUTO
// ------------------------------------------------------

export const saveProductForUser = async (
  userId: string,
  product: Omit<ProductQuantity, "id">
): Promise<string> => {
  const ref = collection(db, "users", userId, "products");
  const { price, ...dataToSave } = product; // não salvar price no banco

  const docRef = await addDoc(ref, dataToSave);
  return docRef.id; // ✅ retorna apenas o ID
};


// ------------------------------------------------------
// REMOVER PRODUTO + MOVIMENTOS
// ------------------------------------------------------

export const removeProductForUser = async (
  userId: string,
  productId: string
) => {
  const ref = doc(db, "users", userId, "products", productId);
  await deleteDoc(ref);

  // remover movimentos associados
  const movRef = collection(db, "users", userId, "movements");
  const q = query(movRef, where("productId", "==", productId));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
};
