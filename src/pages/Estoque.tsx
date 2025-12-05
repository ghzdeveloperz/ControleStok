/* src/pages/Estoque.tsx */
"use client";

import React, { useState, useEffect } from "react";
import { ProductCard, Product } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/ModalRemoveProduct";
import { ProductDetailsModal } from "../components/modals/ProductDetailsModal";
import { ModalManageCategories } from "../components/modals/ModalManageCategories";
import { AlertBanner } from "../components/AlertBanner";

// products.ts
import {
  removeProductForUser,
} from "../firebase/firestore/products";

// movements.ts
import {
  saveMovementForUser,
} from "../firebase/firestore/movements";

// categories.ts
import {
  getCategoriesForUser,
  onCategoriesUpdateForUser,
} from "../firebase/firestore/categories";

import { useProducts } from "../hooks/useProducts";
import { useNavigate } from "react-router-dom";

interface EstoqueProps {
  userId: string;
}

const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function Estoque({ userId }: EstoqueProps) {
  const navigate = useNavigate();
  const { products: rawProducts, loading } = useProducts(userId);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [alert, setAlert] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const [categories, setCategories] = useState<string[]>([]);

  // Carrega categorias (fetch inicial + realtime)
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const fetchAndSubscribe = async () => {
      try {
        const cats = await getCategoriesForUser(userId);
        setCategories(cats);
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
      }

      try {
        unsub = onCategoriesUpdateForUser(userId, (cats) => {
          setCategories(cats);

          // se o filtro atual não existir mais, reseta para "Todos"
          if (filter !== "Todos" && !cats.includes(filter)) {
            setFilter("Todos");
          }
        });
      } catch (err) {
        console.error("Erro ao inscrever em categorias:", err);
      }
    };

    fetchAndSubscribe();

    return () => {
      if (typeof unsub === "function") unsub();
    };
    // Intencional: dependemos de userId e filter so para resetar o filtro se necessário
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Padronização dos produtos
  const products: Product[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name ?? "Sem nome",
    quantity: Number(p.quantity ?? 0),
    price: Number(p.price ?? 0),
    unitPrice: Number(p.unitPrice ?? 0),
    category: p.category ?? "Sem categoria",
    minStock: Number(p.minStock ?? 0),
    image: p.image ?? "/images/placeholder.png",

    // 🔥 Campo adicional apenas no front-end (não existe no banco)
    cost: Number(p.price ?? 0),
  }));

  // Filtro + busca
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      filter === "Todos" || product.category === filter;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Alert temporizado
  const showTimedAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 2000);
  };

  // Adicionar quantidade
  const handleAddProduct = async (
    productId: string,
    quantity: number,
    date: string,
    cost: number,
    unitPrice?: number
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      const payload = {
        productId,
        productName: product.name,
        quantity,
        type: "add" as const,
        date,
        cost,
        price: unitPrice ?? cost,
        unitPrice: unitPrice ?? cost,
      } as any;

      await saveMovementForUser(userId, payload);

      showTimedAlert("Produto adicionado!", "success");
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
      showTimedAlert("Erro ao adicionar!", "error");
    }
  };

  // Remover quantidade ou excluir produto
  const handleRemoveProduct = async (
    productId: string,
    qty?: number,
    removeEntire?: boolean,
    exitDate?: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      if (removeEntire) {
        await removeProductForUser(userId, productId);
        showTimedAlert("Produto excluído do estoque!", "error");
        return;
      }

      if (qty && qty > 0) {
        if (qty > product.quantity) {
          showTimedAlert(
            `Não é possível remover mais que ${product.quantity} unidades.`,
            "error"
          );
          return;
        }

        const payload = {
          productId,
          productName: product.name,
          quantity: qty,
          type: "remove" as const,
          date: exitDate ?? getLocalDate(),
          price: product.unitPrice,
          cost: product.price,
          unitPrice: product.unitPrice,
        } as any;

        await saveMovementForUser(userId, payload);

        showTimedAlert("Quantidade removida!", "error");
      }
    } catch (err) {
      console.error("Erro ao remover produto:", err);
      showTimedAlert("Erro ao remover!", "error");
    }
  };

  // Skeleton de loading
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-8 animate-pulse">
        <div className="h-10 bg-gray-300 rounded w-1/3" />
        <div className="h-6 bg-gray-300 rounded w-1/2" />
        <div className="h-40 bg-gray-300 rounded" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen overflow-y-auto">
      {alert && (
        <AlertBanner {...alert} onClose={() => setAlert(null)} />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-lime-900 text-white rounded cursor-pointer"
          >
            Adicionar
          </button>

          <button
            onClick={() => setShowRemoveModal(true)}
            className="px-4 py-2 bg-red-800 text-white rounded cursor-pointer"
          >
            Remover
          </button>

          {/* botão para gerenciar categorias */}
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded cursor-pointer"
            title="Gerenciar categorias"
          >
            Categorias
          </button>
        </div>
      </div>

      {/* Busca */}
      <input
        type="text"
        placeholder="Buscar produto..."
        className="border p-2 rounded w-full mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filtro de categorias */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["Todos", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1 rounded cursor-pointer transition ${filter === cat
              ? "bg-black text-white"
              : "bg-gray-200 hover:bg-gray-300"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tela vazia */}
      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
          {/* Ícone discreto preto e branco */}
          <div className="flex items-center justify-center w-24 h-24 bg-gray-200 text-gray-800 rounded-full mb-4 text-5xl shadow-sm">
            📦
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Que tal começarmos adicionando um produto?
          </h2>

          <p className="text-gray-500 mb-6 max-w-md">
            Parece que seu estoque ainda está vazio. Adicione seu primeiro item para começar.
          </p>

          <button
            onClick={() => navigate("/estoque/novoproduto")}
            className="px-6 py-3 bg-black text-white font-medium rounded-lg shadow hover:bg-gray-900 transition cursor-pointer"
          >
            Adicionar Produto
          </button>
        </div>
      )}

      {/* Lista de produtos */}
      <ProductCard
        userId={userId}
        products={filteredProducts}
        onSelect={(p) => setSelectedProduct(p)}
      />

      {/* Modal adicionar */}
      {showAddModal && (
        <ModalAddProduct
          products={products}
          onAdd={handleAddProduct}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Modal remover */}
      {showRemoveModal && (
        <ModalRemoveProduct
          products={products}
          onRemove={async (productId: string, qty: number, date?: string) => {
            await handleRemoveProduct(productId, qty, false, date);
          }}
          onClose={() => setShowRemoveModal(false)}
        />
      )}

      {/* Modal detalhes */}
      {selectedProduct && (
        <ProductDetailsModal
          userId={userId}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onRemove={async (productId: string, removeEntire?: boolean) => {
            await handleRemoveProduct(productId, undefined, removeEntire);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Modal Gerenciar Categorias */}
      <ModalManageCategories
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        categories={categories}
        setCategories={setCategories}
        userId={userId}
      />
    </div>
  );
}
