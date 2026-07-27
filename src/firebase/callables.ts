import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

type MovementType = "add" | "remove";

export interface CreateProductInput {
  name: string;
  category: string;
  quantity: number;
  cost: number;
  unitPrice: number;
  image?: string | null;
  minStock: number;
  barcode: string;
  date: string;
}

export interface AdjustStockInput {
  productId: string;
  type: MovementType;
  quantity: number;
  date: string;
  cost?: number;
  unitPrice?: number;
}

export interface ProductChanges {
  name?: string;
  category?: string;
  minStock?: number;
  barcode?: string;
}

const createRequestId = () => crypto.randomUUID();

const createProductCallable = httpsCallable<
  CreateProductInput & { requestId: string },
  { productId: string }
>(functions, "createProduct");

const adjustStockCallable = httpsCallable<
  AdjustStockInput & { requestId: string },
  { quantity: number }
>(functions, "adjustStock");

const updateProductCallable = httpsCallable<
  { productId: string; changes: ProductChanges; requestId: string },
  { success: true }
>(functions, "updateProduct");

const archiveProductCallable = httpsCallable<
  { productId: string; requestId: string },
  { success: true }
>(functions, "archiveProduct");

const createCategoryCallable = httpsCallable<
  { name: string; requestId: string },
  { categoryId: string }
>(functions, "createCategory");

const deleteCategoryCallable = httpsCallable<
  { name: string; requestId: string },
  { success: true }
>(functions, "deleteCategory");

export const createProduct = async (input: CreateProductInput) => {
  const response = await createProductCallable({
    ...input,
    requestId: createRequestId(),
  });
  return response.data.productId;
};

export const adjustStock = async (input: AdjustStockInput) => {
  const response = await adjustStockCallable({
    ...input,
    requestId: createRequestId(),
  });
  return response.data.quantity;
};

export const updateProduct = async (
  productId: string,
  changes: ProductChanges,
) => {
  await updateProductCallable({
    productId,
    changes,
    requestId: createRequestId(),
  });
};

export const archiveProduct = async (productId: string) => {
  await archiveProductCallable({ productId, requestId: createRequestId() });
};

export const createCategory = async (name: string) => {
  const response = await createCategoryCallable({
    name,
    requestId: createRequestId(),
  });
  return response.data.categoryId;
};

export const deleteCategory = async (name: string) => {
  await deleteCategoryCallable({ name, requestId: createRequestId() });
};
