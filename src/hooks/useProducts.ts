// src/hooks/useProducts.ts
import { useEffect, useState } from "react";
import { ProductQuantity, getProducts, onProductsUpdate } from "../firebase/firestore/products";

let globalSetProducts: ((products: ProductQuantity[]) => void) | null = null;

export const updateProducts = (products: ProductQuantity[]) => {
  if (globalSetProducts) globalSetProducts(products);
};

export const useProducts = () => {
  const [products, setProducts] = useState<ProductQuantity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    globalSetProducts = setProducts; // define global para updateProducts
    let unsubscribe: (() => void) | undefined;

    const load = async () => {
      const initialProducts = await getProducts();
      setProducts(initialProducts);
      setLoading(false);

      unsubscribe = onProductsUpdate((updatedProducts) => {
        setProducts(updatedProducts);
      });
    };

    load();

    return () => {
      if (unsubscribe) unsubscribe();
      globalSetProducts = null;
    };
  }, []);

  return { products, loading };
};
