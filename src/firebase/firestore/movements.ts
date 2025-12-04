// src/firebase/firestore/movements.ts

import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
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
  date: string; // sempre no formato YYYY-MM-DD
}

// ------------------------------------------------------
// SALVAR MOVIMENTO
// ------------------------------------------------------

// OBS: NÃO ALTERAMOS MAIS O quantity DO PRODUTO AQUI!
// A quantidade total será calculada a partir do histórico de movimentos.
export const saveMovementForUser = async (
  userId: string,
  data: Omit<StockMovement, "id"> & { date: string | Date } // permite string ou Date
): Promise<StockMovement> => {

  // garante que a data esteja sempre no formato YYYY-MM-DD
  const dateString =
    typeof data.date === "string"
      ? data.date
      : (data.date as Date).toISOString().split("T")[0];

  // salva movimento
  const movRef = collection(db, "users", userId, "movements");
  const docRef = await addDoc(movRef, {
    ...data,
    date: dateString,
    timestamp: serverTimestamp(), // para ordenação por tempo se necessário
  });

  return { ...data, id: docRef.id, date: dateString };
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
      date: data.date, // já no formato YYYY-MM-DD
    };
  });
};
