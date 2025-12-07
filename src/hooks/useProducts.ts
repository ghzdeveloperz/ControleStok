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
  barcode?: string;   // 🔥 ADICIONE ISSO
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
          // Normalizações de segurança
          const price = Number(
            p.price ??
            p.cost ??          // caso venha de sistemas antigos
            p.unitPrice ??     // fallback
            0
          );

          const unitPrice = Number(
            p.unitPrice ??
            p.price ??         // produtos sem custo unitário explícito
            p.cost ??          // fallback
            0
          );

          return {
            id: p.id,
            name: p.name ?? "Sem nome",
            quantity: Number(p.quantity ?? 0),
            price,
            unitPrice,
            category: p.category ?? "Sem categoria",
            minStock: Number(p.minStock ?? 0),
            image: p.image ?? "/images/placeholder.png",
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
