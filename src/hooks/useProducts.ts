// src/hooks/useProducts.ts
import { useEffect, useState } from "react";
import {
  ProductQuantity,
  onProductsUpdate,
} from "../firebase/firestore/products";

export const useProducts = () => {
  const [products, setProducts] = useState<ProductQuantity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener único do Firestore
    const unsubscribe = onProductsUpdate((updatedProducts) => {
      setProducts(updatedProducts);
      setLoading(false); // terminou de carregar
    });

    return () => unsubscribe();
  }, []);

  return { products, loading };
};
