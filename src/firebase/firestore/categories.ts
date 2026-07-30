import { collection, getDocs, onSnapshot } from "firebase/firestore";
import type { FirestoreError } from "firebase/firestore";
import { createCategory, deleteCategory } from "../callables";
import { db } from "../firebase";

const assertWorkspaceId = (workspaceId: string) => {
  if (
    typeof workspaceId !== "string" ||
    workspaceId.trim().length === 0 ||
    workspaceId.length > 128 ||
    workspaceId.includes("/")
  ) {
    throw new Error("Workspace inválido.");
  }
};

const formatCategoryName = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

export const saveCategoryForUser = async (
  workspaceId: string,
  name: string,
) => {
  assertWorkspaceId(workspaceId);
  const formatted = formatCategoryName(name);
  if (!formatted || formatted.length > 80) throw new Error("Categoria inválida.");
  await createCategory(formatted);
};

export const getCategoriesForUser = async (
  workspaceId: string,
): Promise<string[]> => {
  assertWorkspaceId(workspaceId);
  const reference = collection(db, "users", workspaceId, "categories");
  const snapshot = await getDocs(reference);

  return snapshot.docs
    .map((document) => document.data().name)
    .filter((name): name is string => typeof name === "string")
    .sort((left, right) => left.localeCompare(right, "pt-BR"));
};

export const onCategoriesUpdateForUser = (
  workspaceId: string,
  callback: (categories: string[]) => void,
  onError?: (error: FirestoreError) => void,
) => {
  assertWorkspaceId(workspaceId);
  const reference = collection(db, "users", workspaceId, "categories");

  return onSnapshot(
    reference,
    (snapshot) => {
      const categories = snapshot.docs
        .map((document) => document.data().name)
        .filter((name): name is string => typeof name === "string")
        .sort((left, right) => left.localeCompare(right, "pt-BR"));
      callback(categories);
    },
    onError,
  );
};

export const deleteCategoryForUser = async (
  workspaceId: string,
  name: string,
) => {
  assertWorkspaceId(workspaceId);
  const formatted = formatCategoryName(name);
  if (!formatted || formatted.length > 80) throw new Error("Categoria inválida.");
  await deleteCategory(formatted);
};
