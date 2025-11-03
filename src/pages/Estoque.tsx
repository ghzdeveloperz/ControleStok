// src/pages/Estoque.tsx
import React, { useEffect, useState } from "react";
import { ProductCard, Product } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/ModalRemoveProduct";
import { AlertBanner } from "../components/AlertBanner";
import { initDB, saveProducts, getProductsQuantities } from "../db"; // nossa db local

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

  // Inicializa IndexedDB e carrega quantidades salvas
  useEffect(() => {
    const loadData = async () => {
      await initDB();
      const savedQuantities = await getProductsQuantities();
      if (savedQuantities.length > 0) {
        // Atualiza apenas as quantidades
        const updatedProducts = initialProducts.map((p) => {
          const saved = savedQuantities.find((sq) => sq.id === p.id);
          return saved ? { ...p, quantity: saved.quantity } : p;
        });
        setProducts(updatedProducts);
      }
    };
    loadData();
  }, []);

  // Filtragem por busca e categoria
  const filteredProducts = products.filter((product) => {
    const matchesCategory = filter === "Todos" || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Atualiza produtos e dispara alerta
  const updateProducts = async (newProducts: Product[], message: string, type: "success" | "error") => {
    setProducts(newProducts);
    setAlert({ message, type });

    // Atualiza IndexedDB apenas com as quantidades
    const quantities: { id: number | string; quantity: number }[] = newProducts.map((p) => ({
      id: p.id,
      quantity: p.quantity,
    }));
    await saveProducts(quantities);

    setTimeout(() => setAlert(null), 2000);
  };

  const handleAddProduct = (productId: number | string, quantity: number, entryDate: string) => {
    const newProducts = products.map((p) =>
      p.id === productId ? { ...p, quantity: p.quantity + quantity } : p
    );
    const addedProduct = products.find((p) => p.id === productId);
    updateProducts(newProducts, `Adicionado ${quantity}x "${addedProduct?.name}" em ${entryDate}`, "success");
  };

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
      {alert && <AlertBanner message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}

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

      <input
        type="text"
        placeholder="Buscar produto..."
        className="cursor-text border p-2 rounded w-full mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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

      <ProductCard products={filteredProducts} />

      {showAddModal && (
        <ModalAddProduct
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddProduct}
          products={products}
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
