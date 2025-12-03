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
// ADICIONAR CATEGORIA
// ------------------------------------------------------

export const saveCategoryForUser = async (userId: string, name: string) => {
  const formatted =
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  const ref = collection(db, "users", userId, "categories");
  await addDoc(ref, { name: formatted });
};

// ------------------------------------------------------
// LISTAR
// ------------------------------------------------------

export const getCategoriesForUser = async (
  userId: string
): Promise<string[]> => {
  const ref = collection(db, "users", userId, "categories");
  const snap = await getDocs(ref);

  return snap.docs.map((d) => d.data().name as string);
};

// ------------------------------------------------------
// LISTENER
// ------------------------------------------------------

export const onCategoriesUpdateForUser = (
  userId: string,
  callback: (categories: string[]) => void
) => {
  const ref = collection(db, "users", userId, "categories");

  return onSnapshot(ref, (snapshot) =>
    callback(snapshot.docs.map((d) => d.data().name as string))
  );
};

// ------------------------------------------------------
// REMOVER
// ------------------------------------------------------

export const deleteCategoryForUser = async (userId: string, name: string) => {
  const ref = collection(db, "users", userId, "categories");
  const q = query(ref, where("name", "==", name));

  const snap = await getDocs(q);

  for (const d of snap.docs) {
    await deleteDoc(d.ref);
  }
};
