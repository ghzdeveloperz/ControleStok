// src/pages/store/products.ts
import { create } from "zustand";
import { Product } from "../../types";




interface ProductsState {
  products: Product[];
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
}

export const useProductsStore = create<ProductsState>((set) => ({
  // produtos iniciais agora no formato novo:
  products: [
    {
      id: "1",
      name: "Produto 1",
      unit: "un",
      supplier: "Fornecedor A",
      stock: 10,
      unitPrice: 29.9,
    },
    {
      id: "2",
      name: "Produto 2",
      unit: "kg",
      supplier: "Fornecedor B",
      stock: 5,
      unitPrice: 49.9,
    },
  ],
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
}));
