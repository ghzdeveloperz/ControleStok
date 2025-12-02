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

// ------------------------------------------------------
// SISTEMA DE LISTENERS
// ------------------------------------------------------

let productListeners: Array<(products: ProductQuantity[]) => void> = [];

export const onProductsUpdate = (listener: (products: ProductQuantity[]) => void) => {
  productListeners.push(listener);

  return () => {
    productListeners = productListeners.filter((l) => l !== listener);
  };
};

export const notifyProducts = async () => {
  const products = await getProducts();
  productListeners.forEach((listener) => listener(products));
};

// ------------------------------------------------------
// FUNÇÕES DE PRODUTO
// ------------------------------------------------------

export const saveProduct = async (product: Omit<ProductQuantity, "id">) => {
  if (!product.name || product.quantity === undefined) {
    throw new Error("Produto inválido: dados incompletos.");
  }

  const docRef = await addDoc(quantitiesRef, product);
  await notifyProducts();

  return { ...product, id: docRef.id };
};

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

export const removeProduct = async (id: string) => {
  await deleteDoc(doc(db, "quantities", id));
  await notifyProducts();
};

// ------------------------------------------------------
// MOVIMENTOS + ATUALIZA QUANTIDADE
// ------------------------------------------------------

export const saveMovement = async (data: Omit<StockMovement, "id">): Promise<StockMovement> => {
  const movementDocRef = await addDoc(movementsRef, data);

  if (!data.productId) {
    throw new Error("ID do produto não fornecido.");
  }

  const productRef = doc(db, "quantities", data.productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    throw new Error("Produto não encontrado. Só é possível mover produtos existentes.");
  }

  const prodData = productSnap.data() as DocumentData;

  const product: ProductQuantity = {
    id: productSnap.id,
    quantity: Number(prodData.quantity ?? 0),
    cost: Number(prodData.cost ?? 0),
    unitPrice: Number(prodData.unitPrice ?? prodData.cost ?? 0),
    name: String(prodData.name ?? "Sem nome"),
    category: String(prodData.category ?? "Sem categoria"),
    image: prodData.image ?? null,
    minStock: Number(prodData.minStock ?? 0),
  };

  const updatedQuantity = data.type === "add" ? product.quantity + data.quantity : product.quantity - data.quantity;

  await updateDoc(productRef, {
    quantity: updatedQuantity,
    cost: data.cost,
    unitPrice: data.price,
  });

  await notifyProducts();

  return { ...data, id: movementDocRef.id };
};

// ------------------------------------------------------
// BUSCAR TODOS OS MOVIMENTOS
// ------------------------------------------------------

export const getAllMovements = async (): Promise<StockMovement[]> => {
  const snapshot = await getDocs(movementsRef);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as DocumentData;

    return {
      id: docSnap.id,
      productId: String(data.productId ?? ""),
      productName: String(data.productName ?? ""),
      quantity: Number(data.quantity ?? 0),
      price: Number(data.price ?? 0),
      cost: Number(data.cost ?? 0),
      type: data.type === "add" ? "add" : "remove",
      date: String(data.date ?? ""),
    };
  });
};

// ------------------------------------------------------
// ALTERNATIVA: FETCH DIRETO
// ------------------------------------------------------

export const fetchProducts = async (): Promise<ProductQuantity[]> => {
  try {
    const snapshot = await getDocs(quantitiesRef);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();

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
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    return [];
  }
};
