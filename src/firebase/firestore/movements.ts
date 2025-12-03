// src/firebase/firestore/movements.ts

import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "../firebase";

// ------------------------------------------------------
// TIPOS
// ------------------------------------------------------

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;

  quantity: number;

  cost: number;
  unitPrice: number;

  type: "add" | "remove";
  date: string;
}

// ------------------------------------------------------
// SALVAR MOVIMENTO
// ------------------------------------------------------

export const saveMovementForUser = async (
  userId: string,
  data: Omit<StockMovement, "id">
): Promise<StockMovement> => {
  const productRef = doc(db, "users", userId, "products", data.productId);
  const snap = await getDoc(productRef);

  if (!snap.exists()) throw new Error("Produto não encontrado.");

  const prod = snap.data() as DocumentData;

  const newQuantity =
    data.type === "add"
      ? Number(prod.quantity ?? 0) + data.quantity
      : Number(prod.quantity ?? 0) - data.quantity;

  // atualiza estoque
  await updateDoc(productRef, {
    quantity: newQuantity,
    cost: data.cost,
    unitPrice: data.unitPrice,
  });

  // salva movimento
  const movRef = collection(db, "users", userId, "movements");
  const docRef = await addDoc(movRef, {
    ...data,
    timestamp: serverTimestamp(),
  });

  return { ...data, id: docRef.id };
};

// ------------------------------------------------------
// LISTAR MOVIMENTOS
// ------------------------------------------------------

export const getAllMovementsForUser = async (
  userId: string
): Promise<StockMovement[]> => {
  const movRef = collection(db, "users", userId, "movements");
  const snapshot = await getDocs(movRef);

  return snapshot.docs.map((d) => {
    const data = d.data() as DocumentData;

    return {
      id: d.id,
      productId: data.productId,
      productName: data.productName,
      quantity: data.quantity,
      cost: data.cost,
      unitPrice: data.unitPrice,
      type: data.type,
      date: data.date,
    };
  });
};
