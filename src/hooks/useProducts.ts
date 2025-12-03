/* src/hooks/useProducts.ts */
import { useEffect, useState } from "react";
import {
  onProductsUpdateForUser,
  ProductQuantity as ProductQuantityFromDB,
} from "../firebase/firestore/products";

// Tipo final usado no FRONTEND
export interface ProductQuantity {
  id: string;
  name: string;
  quantity: number;

  price: number;      // calculado
  unitPrice: number;  // do banco
  category: string;
  minStock: number;
  image?: string;
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

    const unsubscribe = onProductsUpdateForUser(
      userId,
      (updatedProducts: ProductQuantityFromDB[]) => {
        const normalized: ProductQuantity[] = updatedProducts.map((p) => {
          // Agora "price" existe no tipo do Firestore (opcional)
          const price = Number(p.price ?? p.cost ?? p.unitPrice ?? 0);
          const unitPrice = Number(p.unitPrice ?? p.price ?? p.cost ?? 0);

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
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [userId]);

  return { products, loading };
};
