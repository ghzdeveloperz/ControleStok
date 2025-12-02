// src/hooks/useProducts.ts
import { useEffect, useState } from "react";
import { ProductQuantity, onProductsUpdate } from "../firebase/firestore/products";

export const useProducts = () => {
  const [products, setProducts] = useState<ProductQuantity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firestore listener — única fonte de dados
    const unsubscribe = onProductsUpdate((updatedProducts) => {
      setProducts(updatedProducts);
      setLoading(false); // carregamento concluído
    });

    // remove o listener ao desmontar o componente
    return () => unsubscribe();
  }, []);

  return { products, loading };
};
