// src/pages/Estoque.tsx
import React, { useState } from "react";
import { ProductCard } from "../components/ProductCard";

const sampleProducts = [
  {
    id: 1,
    name: "Sushi Especial",
    price: 49.9,
    quantity: 10,
    category: "Asiáticos",
    image: "./images/sushi-especial.jpg", // coloque em public/images
  },
  {
    id: 2,
    name: "Pizza Calabresa",
    price: 79.9,
    quantity: 0,
    category: "Quentes",
    image: "./images/pizzas.jpeg", // coloque em public/images
  },
  {
    id: 3,
    name: "Salada Fresca",
    price: 19.9,
    quantity: 5,
    category: "Frios",
    image: "./images/salada.jpg", // coloque em public/images
  },
  {
    id: 4,
    name: "Lamen Tradicional",
    price: 29.9,
    quantity: 3,
    category: "Asiáticos",
    image: "./images/lamen-tradicional.jpg", // coloque em public/images
  },
];

export const Estoque: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  // Filtragem de produtos por busca + categoria
  const filteredProducts = sampleProducts.filter((product) => {
    const matchesCategory =
      filter === "Todos" || product.category === filter;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Estoque</h1>

      {/* Campo de busca */}
      <input
        type="text"
        placeholder="Buscar produto..."
        className="border p-2 rounded w-full mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {["Todos", "Quentes", "Frios", "Asiáticos"].map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded cursor-pointer transition ${
              filter === cat
                ? "bg-black text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Render dos produtos */}
      <ProductCard products={filteredProducts} />
    </div>
  );
};
