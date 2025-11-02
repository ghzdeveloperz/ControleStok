// src/pages/Estoque.tsx
import React, { useState } from "react";
import { ProductCard, Product } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/ModalRemoveProduct";
import { AlertBanner } from "../components/AlertBanner";

// Produtos iniciais
const initialProducts: Product[] = [
  {
    id: 1,
    name: "Niguiri",
    price: 49.8,
    quantity: 20,
    category: "Sushi",
    image: "/images/sushi-especial.jpg",
  },
  {
    id: 2,
    name: "Uramaki Philadelfia",
    price: 49.8,
    quantity: 20,
    category: "Sushi",
    image: "/images/uramaki_philadelfia.png",
  },
];

export const Estoque: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filtragem por busca e categoria
  const filteredProducts = products.filter((product) => {
    const matchesCategory = filter === "Todos" || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Atualiza produtos e dispara alerta
  const updateProducts = (newProducts: Product[], message: string, type: "success" | "error") => {
    setProducts(newProducts);
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 2000);
  };

  // Adicionar produto existente
  const handleAddProduct = (productId: number | string, quantity: number, entryDate: string) => {
    const newProducts = products.map((p) =>
      p.id === productId ? { ...p, quantity: p.quantity + quantity } : p
    );
    const addedProduct = products.find((p) => p.id === productId);
    updateProducts(newProducts, `Adicionado ${quantity}x "${addedProduct?.name}" em ${entryDate}`, "success");
  };

  // Remover produto existente
  const handleRemoveProduct = (productId: number | string, quantity: number, exitDate: string) => {
    const newProducts = products.map((p) =>
      p.id === productId ? { ...p, quantity: p.quantity - quantity } : p
    );
    const removedProduct = products.find((p) => p.id === productId);
    if (removedProduct) {
      updateProducts(newProducts, `Removido ${quantity}x "${removedProduct.name}" em ${exitDate}`, "error");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Banner de alert */}
      {alert && <AlertBanner message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

      {/* Header com título e botões */}
      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>

        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-lime-900 text-white rounded hover:bg-green-700 transition"
          >
            Adicionar Produto
          </button>
          <button
            onClick={() => setShowRemoveModal(true)}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-red-800 text-white rounded hover:bg-red-700 transition"
          >
            Remover Produto
          </button>
        </div>
      </div>

      {/* Campo de busca */}
      <input
        type="text"
        placeholder="Buscar produto..."
        className="cursor-text border p-2 rounded w-full mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["Todos", "Brasileiros", "Asiáticos", "Sushi", "Limpeza", "Frios"].map((cat) => (
          <button
            key={cat}
            className={`cursor-pointer px-4 py-1 rounded text-sm transition ${
              filter === cat ? "bg-black text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Vitrine de produtos */}
      <ProductCard products={filteredProducts} />

      {/* Modais */}
      {showAddModal && (
        <ModalAddProduct
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProduct}
          products={products} // passa lista de produtos existentes
        />
      )}
      {showRemoveModal && (
        <ModalRemoveProduct
          products={products}
          onClose={() => setShowRemoveModal(false)}
          onRemove={handleRemoveProduct}
        />
      )}
    </div>
  );
};
