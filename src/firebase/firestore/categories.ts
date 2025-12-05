// src/firebase/firestore/categories.ts

import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

// ------------------------------------------------------
// HELPERS DE SEGURANÇA
// ------------------------------------------------------

const assertValidUserId = (userId: string) => {
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    console.error("Erro: userId inválido recebido:", userId);
    throw new Error("Firestore: userId inválido");
  }
};

const formatCategoryName = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

// ------------------------------------------------------
// ADICIONAR CATEGORIA
// ------------------------------------------------------

export const saveCategoryForUser = async (userId: string, name: string) => {
  assertValidUserId(userId);

  const formatted = formatCategoryName(name);
  if (!formatted) throw new Error("Categoria inválida.");

  const ref = collection(db, "users", userId, "categories");
  await addDoc(ref, { name: formatted });
};

// ------------------------------------------------------
// LISTAR
// ------------------------------------------------------

export const getCategoriesForUser = async (
  userId: string
): Promise<string[]> => {
  assertValidUserId(userId);

  const ref = collection(db, "users", userId, "categories");
  const snap = await getDocs(ref);

  return snap.docs.map((d) => d.data().name as string);
};

// ------------------------------------------------------
// LISTENER (Realtime)
// ------------------------------------------------------

export const onCategoriesUpdateForUser = (
  userId: string,
  callback: (categories: string[]) => void
) => {
  assertValidUserId(userId);

  const ref = collection(db, "users", userId, "categories");

  return onSnapshot(ref, (snapshot) => {
    const list = snapshot.docs.map((d) => d.data().name as string);
    callback(list);
  });
};

// ------------------------------------------------------
// REMOVER
// ------------------------------------------------------

export const deleteCategoryForUser = async (userId: string, name: string) => {
  assertValidUserId(userId);

  const formatted = formatCategoryName(name);
  if (!formatted) throw new Error("Categoria inválida.");

  const ref = collection(db, "users", userId, "categories");
  const q = query(ref, where("name", "==", formatted));

  const snap = await getDocs(q);

  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
};
