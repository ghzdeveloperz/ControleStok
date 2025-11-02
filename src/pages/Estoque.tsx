import React, { useState } from "react";
import { ProductCard, Product } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/ModalRemoveProduct";
import { AlertBanner } from "../components/AlertBanner";

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Sushi Especial",
    price: 49.9,
    quantity: 10,
    category: "Sushi",
    image: "/images/sushi-especial.jpg",
  },
  {
    id: 2,
    name: "Pizza Calabresa",
    price: 79.9,
    quantity: 0,
    category: "Brasileiros",
    image: "/images/pizzas.jpeg",
  },
  {
    id: 3,
    name: "Salada Fresca",
    price: 19.9,
    quantity: 5,
    category: "Frios",
    image: "/images/salada.jpg",
  },
  {
    id: 4,
    name: "Lamen Tradicional",
    price: 29.9,
    quantity: 3,
    category: "Asiáticos",
    image: "/images/lamen-tradicional.jpg",
  },
];

export const Estoque: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filtragem de produtos por busca + categoria
  const filteredProducts = products.filter((product) => {
    const matchesCategory = filter === "Todos" || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddProduct = (product: Product, entryDate: string) => {
    setProducts((prev) => [...prev, product]);
    setAlert({
      message: `Adicionado ${product.quantity}x "${product.name}" em ${entryDate}`,
      type: "success",
    });
  };

  const handleRemoveProduct = (productId: number | string, quantity: number, exitDate: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, quantity: p.quantity - quantity } : p
      )
    );

    const removedProduct = products.find((p) => p.id === productId);
    if (removedProduct) {
      setAlert({
        message: `Removido ${quantity}x "${removedProduct.name}" em ${exitDate}`,
        type: "error",
      });
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Banner de alert */}
      {alert && (
        <AlertBanner
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header com título e botões */}
      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>

        <div className="flex gap-2 mt-2 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Adicionar Produto
          </button>
          <button
            onClick={() => setShowRemoveModal(true)}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-red-600 text-white rounded hover:bg-red-700 transition"
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

      {/* Vitrine de produtos */}
      <ProductCard products={filteredProducts} />

      {/* Modais */}
      {showAddModal && (
        <ModalAddProduct
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProduct}
          nextId={products.length + 1}
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
