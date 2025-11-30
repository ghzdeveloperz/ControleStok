// src/pages/Estoque.tsx
import React, { useEffect, useState } from "react";
import { ProductCard, Product } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/ModalRemoveProduct";
import { ProductDetailsModal } from "../components/modals/ProductDetailsModal";
import { AlertBanner } from "../components/AlertBanner";
import {
  initDB,
  saveProducts,
  getProducts,
  clearDB,
  ProductQuantity,
} from "../db";

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Niguiri",
    price: 49.8, // custo médio inicial
    unitPrice: 49.8, // preço unitário inicial
    quantity: 20,
    minStock: 10,
    category: "Sushi",
    image: "/images/sushi-especial.jpg",
  },
  {
    id: 2,
    name: "Uramaki Philadelfia",
    price: 49.8,
    unitPrice: 49.8,
    quantity: 20,
    minStock: 10,
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // =====================================================
  // 🔥 Agora o carregamento respeita unitPrice SEMPRE!
  // =====================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const stored = await getProducts(); // ProductQuantity[]

        if (Array.isArray(stored) && stored.length > 0) {
          const merged = initialProducts.map((p) => {
            const found = stored.find((s) => String(s.id) === String(p.id));

            return {
              ...p,
              quantity: found?.quantity ?? p.quantity,
              price: found?.cost ?? p.price, // custo médio salvo
              unitPrice: found?.unitPrice ?? p.unitPrice, // unitPrice REAL salvo
            } as Product;
          });

          setProducts(merged);
        } else {
          // primeira execução → salvar valores iniciais
          await saveProducts(
            initialProducts.map((p) => ({
              id: p.id,
              quantity: p.quantity,
              cost: p.price,
              unitPrice: p.unitPrice,
            }))
          );
          setProducts(initialProducts);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    };

    loadData();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = filter === "Todos" || product.category === filter;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateProducts = async (
    newProducts: Product[],
    message: string,
    type: "success" | "error"
  ) => {
    setProducts(newProducts);
    setAlert({ message, type });

    await saveProducts(
      newProducts.map((p) => ({
        id: p.id,
        quantity: p.quantity,
        cost: p.price, // custo médio
        unitPrice: p.unitPrice, // unitário REAL e independente
      }))
    );

    setTimeout(() => setAlert(null), 2000);
  };

  // =====================================================
  // 🔥 Agora unitPrice NÃO é mais modificado automaticamente!
  // =====================================================
  const handleAddProduct = (
    productId: Product["id"],
    qty: number,
    date: string,
    newAvgCost: number,
    newUnitPrice?: number
  ) => {
    const newProducts = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            quantity: p.quantity + qty,
            price: newAvgCost, // custo médio atualizado
            unitPrice: newUnitPrice ?? p.unitPrice, // unitPrice permanece o input do usuário
          }
        : p
    );

    updateProducts(newProducts, "Produto adicionado!", "success");
  };

  const handleRemoveProduct = (productId: Product["id"], qty: number) => {
    const newProducts = products.map((p) =>
      p.id === productId
        ? {
            ...p,
            quantity: Math.max(0, p.quantity - qty),
          }
        : p
    );

    updateProducts(newProducts, "Produto removido!", "error");
  };

  const handleClearStorage = async () => {
    await clearDB();
    setProducts(initialProducts);
    setAlert({ message: "Armazenamento limpo!", type: "success" });
    setTimeout(() => setAlert(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6">
      {alert && <AlertBanner {...alert} onClose={() => setAlert(null)} />}

      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="cursor-pointer px-4 py-2 bg-lime-900 text-white rounded"
          >
            Adicionar
          </button>

          <button
            onClick={() => setShowRemoveModal(true)}
            className="cursor-pointer px-4 py-2 bg-red-800 text-white rounded"
          >
            Remover
          </button>

          <button
            onClick={handleClearStorage}
            className="cursor-pointer px-4 py-2 bg-gray-700 text-white rounded"
          >
            Limpar Armazenamento
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Buscar produto..."
        className="border p-2 rounded w-full mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 mb-6 flex-wrap">
        {["Todos", "Brasileiros", "Asiáticos", "Sushi", "Limpeza", "Frios"].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1 rounded ${
                filter === cat ? "bg-black text-white" : "bg-gray-200"
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      <ProductCard
        products={filteredProducts}
        onSelect={(p) => setSelectedProduct(p)}
      />

      {showAddModal && (
        <ModalAddProduct
          products={products}
          onAdd={handleAddProduct}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showRemoveModal && (
        <ModalRemoveProduct
          products={products}
          onRemove={handleRemoveProduct}
          onClose={() => setShowRemoveModal(false)}
        />
      )}

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};
