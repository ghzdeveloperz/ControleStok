import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import type { DocumentData, FirestoreError } from "firebase/firestore";
import {
  archiveProduct,
  createProduct,
  updateProduct,
  type ProductChanges,
} from "../callables";
import { db } from "../firebase";
import { sanitizeImageSource } from "../../utils/imageValidation";

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
  barcode: string;
}

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

const mapProduct = (id: string, data: DocumentData): ProductQuantity => ({
  id,
  name: typeof data.name === "string" ? data.name : "Produto sem nome",
  quantity: Number(data.quantity ?? 0),
  cost: Number(data.cost ?? 0),
  unitPrice: Number(data.unitPrice ?? 0),
  price: Number(data.price ?? data.cost ?? data.unitPrice ?? 0),
  category:
    typeof data.category === "string" ? data.category : "Sem categoria",
  image: sanitizeImageSource(data.image, "", 500_000) || null,
  minStock: Number(data.minStock ?? 0),
  barcode: typeof data.barcode === "string" ? data.barcode : "",
});

export const onProductsUpdateForUser = (
  workspaceId: string,
  callback: (products: ProductQuantity[]) => void,
  onError?: (error: FirestoreError) => void,
) => {
  assertWorkspaceId(workspaceId);
  const reference = collection(db, "users", workspaceId, "products");

  return onSnapshot(
    reference,
    (snapshot) => {
      const products = snapshot.docs
        .filter((document) => document.data().archived !== true)
        .map((document) => mapProduct(document.id, document.data()));
      callback(products);
    },
    onError,
  );
};

export const getProductsForUser = async (
  workspaceId: string,
): Promise<ProductQuantity[]> => {
  assertWorkspaceId(workspaceId);
  const reference = collection(db, "users", workspaceId, "products");
  const snapshot = await getDocs(reference);

  return snapshot.docs
    .filter((document) => document.data().archived !== true)
    .map((document) => mapProduct(document.id, document.data()));
};

export const saveProductForUser = async (
  workspaceId: string,
  product: Omit<ProductQuantity, "id">,
  date: string,
): Promise<string> => {
  assertWorkspaceId(workspaceId);

  return createProduct({
    name: product.name,
    category: product.category,
    quantity: product.quantity,
    cost: Number(product.cost ?? product.unitPrice ?? 0),
    unitPrice: Number(product.unitPrice ?? product.cost ?? 0),
    image: product.image,
    minStock: product.minStock,
    barcode: product.barcode,
    date,
  });
};

export const removeProductForUser = async (
  workspaceId: string,
  productId: string,
) => {
  assertWorkspaceId(workspaceId);
  if (!productId || productId.includes("/")) throw new Error("Produto inválido.");
  await archiveProduct(productId);
};

export const updateProductForUser = async (
  workspaceId: string,
  productId: string,
  changes: ProductChanges,
) => {
  assertWorkspaceId(workspaceId);
  if (!productId || productId.includes("/")) throw new Error("Produto inválido.");
  await updateProduct(productId, changes);
};

export const findProductByBarcode = async (
  workspaceId: string,
  barcode: string,
): Promise<ProductQuantity | null> => {
  assertWorkspaceId(workspaceId);
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode || normalizedBarcode.length > 128) return null;

  const reference = collection(db, "users", workspaceId, "products");
  const barcodeQuery = query(
    reference,
    where("barcode", "==", normalizedBarcode),
  );
  const snapshot = await getDocs(barcodeQuery);
  const document = snapshot.docs.find(
    (candidate) => candidate.data().archived !== true,
  );

  return document ? mapProduct(document.id, document.data()) : null;
};
