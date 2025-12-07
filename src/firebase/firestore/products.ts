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

  barcode?: string;
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
        barcode: d.barcode ?? "",
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
        barcode: d.barcode ?? "",
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
      barcode: d.barcode ?? "",
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

  const { price, ...dataToSave } = product;

  const docRef = await addDoc(ref, dataToSave);
  return docRef.id;
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

  const movRef = collection(db, "users", userId, "movements");
  const q = query(movRef, where("productId", "==", productId));
  const snap = await getDocs(q);

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};

// ------------------------------------------------------
// BARCODE SUPPORT
// ------------------------------------------------------

export const findProductByBarcode = async (
  userId: string,
  barcode: string
): Promise<ProductQuantity | null> => {
  const ref = collection(db, "users", userId, "products");

  const q = query(ref, where("barcode", "==", barcode));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  const d = docSnap.data() as any;

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
    barcode: d.barcode ?? "",
  };
};

export const saveBarcodeToProduct = async (
  userId: string,
  productId: string,
  barcode: string
) => {
  const ref = doc(db, "users", userId, "products", productId);
  await updateDoc(ref, { barcode });
};
