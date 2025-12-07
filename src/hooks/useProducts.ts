/* src/hooks/useProducts.ts */

"use client";

import { useEffect, useState } from "react";
import {
  onProductsUpdateForUser,
  ProductQuantity as ProductQuantityFromDB,
} from "../firebase/firestore/products";

// Tipo usado no FRONTEND
export interface ProductQuantity {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unitPrice: number;
  category: string;
  minStock: number;
  image?: string;
  barcode: string; // 🔥 GARANTIDO
}

export const useProducts = (userId: string) => {
  const [products, setProducts] = useState<ProductQuantity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listener em tempo real 🔥
    const unsubscribe = onProductsUpdateForUser(
      userId,
      (updatedProducts: ProductQuantityFromDB[]) => {
        const normalized: ProductQuantity[] = updatedProducts.map((p) => {
          // Garantir que todos os campos estejam presentes e convertidos corretamente
          const price = Number(p.price ?? p.cost ?? p.unitPrice ?? 0);
          const unitPrice = Number(p.unitPrice ?? p.price ?? p.cost ?? 0);
          const quantity = Number(p.quantity ?? 0);
          const minStock = Number(p.minStock ?? 10);
          const name = p.name?.trim() || "Sem nome";
          const category = p.category?.trim() || "Sem categoria";
          const image = p.image || "/images/placeholder.png";
          const barcode = p.barcode?.trim() || ""; // 🔥 GARANTIDO

          return {
            id: p.id,
            name,
            quantity,
            price,
            unitPrice,
            category,
            minStock,
            image,
            barcode,
          };
        });

        setProducts(normalized);
        setLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [userId]);

  return { products, loading };
};
