import React from "react";
import { Sidebar } from "../components/Sidebar";
import { ProductCard } from "../components/ProductCard";

const sampleProducts = [
  { id: 1, name: "Produto A", price: 49.9, quantity: 10, image: "https://via.placeholder.com/300x200" },
  { id: 2, name: "Produto B", price: 79.9, quantity: 0, image: "https://via.placeholder.com/300x200" },
  { id: 3, name: "Produto C", price: 19.9, quantity: 5, image: "https://via.placeholder.com/300x200" },
  { id: 4, name: "Produto D", price: 29.9, quantity: 7, image: "https://via.placeholder.com/300x200" },
];

export function Dashboard() {
  return (
    <div className="flex h-screen">
      {/* Passando 'estoque' como opção ativa */}
      <Sidebar active="Estoque" />

      <div className="relative flex-1">
        <main className="bg-gray-50 p-6 overflow-auto h-full">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Estoque</h1>
          <ProductCard products={sampleProducts} />
        </main>

        <div
          className="absolute top-0 right-0 h-full"
          style={{
            width: "3px",
            background: "#5e5e5e",
            boxShadow: "1px 0 3px rgba(0,0,0,0.1)",
          }}
        />
      </div>
    </div>
  );
}
