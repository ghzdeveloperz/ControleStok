// src/pages/Estoque.tsx
import React from "react";
import { ProductCard } from "../components/ProductCard";

const sampleProducts = [
  {
    id: 1,
    name: "Produto A",
    price: 49.9,
    quantity: 10,
    image: "https://via.placeholder.com/300x200",
  },
  {
    id: 2,
    name: "Produto B",
    price: 79.9,
    quantity: 0,
    image: "https://via.placeholder.com/300x200",
  },
  {
    id: 3,
    name: "Produto C",
    price: 19.9,
    quantity: 5,
    image: "https://via.placeholder.com/300x200",
  },
];

export const Estoque: React.FC = () => {
  return <ProductCard products={sampleProducts} />;
};
