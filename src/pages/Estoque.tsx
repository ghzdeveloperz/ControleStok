"use client";

import React, { useState, useEffect } from "react";
import { ProductCard, Product } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/ModalRemoveProduct";
import { ProductDetailsModal } from "../components/modals/ProductDetailsModal";
import { AlertBanner } from "../components/AlertBanner";

import {
  saveMovement,
  removeProduct,
  getCategories,
  onCategoriesUpdate,
} from "../firebase/firestore/products";

import { useProducts } from "../hooks/useProducts";
import { useNavigate } from "react-router-dom";

const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

export default function Estoque() {
  const navigate = useNavigate();

  // Agora com o loading
  const { products: rawProducts, loading } = useProducts();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCats = async () => setCategories(await getCategories());
    fetchCats();

    const unsubscribe = onCategoriesUpdate((cats) => setCategories(cats));
    return () => unsubscribe();
  }, []);

  const products: Product[] = rawProducts.map((p) => ({
    id: p.id,
    name: p.name ?? "Sem nome",
    quantity: p.quantity ?? 0,
    price: p.cost ?? 0,
    unitPrice: p.unitPrice ?? p.cost ?? 0,
    category: p.category ?? "Sem categoria",
    minStock: p.minStock ?? 0,
    image: p.image ?? "/images/placeholder.png",
  }));

  const filteredProducts = products.filter((product) => {
    const matchesCategory = filter === "Todos" || product.category === filter;
    const matchesSearch = (product.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const showTimedAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 2000);
  };

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
      await saveMovement({
        productId,
        productName: product.name,
        quantity,
        type: "add",
        date,
        cost,
        price: unitPrice ?? cost,
      });

      showTimedAlert("Produto adicionado!", "success");
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
      showTimedAlert("Erro ao adicionar!", "error");
    }
  };

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
        await removeProduct(productId);
        showTimedAlert("Produto excluído do estoque!", "error");
      } else if (qty && qty > 0) {
        if (qty > product.quantity) {
          showTimedAlert(`Não é possível remover mais que ${product.quantity} unidades.`, "error");
          return;
        }

        await saveMovement({
          productId,
          productName: product.name ?? "Sem nome",
          quantity: qty,
          price: product.unitPrice ?? 0,
          cost: product.price ?? 0,
          type: "remove",
          date: exitDate ?? getLocalDate(),
        });

        showTimedAlert("Quantidade removida!", "error");
      }
    } catch (err) {
      console.error("Erro ao remover produto:", err);
      showTimedAlert("Erro ao remover produto!", "error");
    }
  };

  // -------------------------------------------------------------------
  // ⭐⭐ SKELETON SHIMMER (100% FUNCIONAL E INTEGRADO) ⭐⭐
  // -------------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-8 animate-pulse">

        {/* Título */}
        <div className="h-8 w-48 bg-gray-300 rounded"></div>

        {/* Barra de busca */}
        <div className="h-10 w-full bg-gray-200 rounded"></div>

        {/* Categorias */}
        <div className="flex gap-4">
          <div className="h-8 w-20 bg-gray-300 rounded"></div>
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
          <div className="h-8 w-24 bg-gray-300 rounded"></div>
        </div>

        {/* Cards placeholders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // ⭐⭐ UI NORMAL APÓS CARREGAR ⭐⭐
  // -------------------------------------------------------------------
  return (
    <div className="p-4 sm:p-6 min-h-screen overflow-y-auto">
      {alert && <AlertBanner {...alert} onClose={() => setAlert(null)} />}

      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h1 className="font-poppins text-2xl font-bold text-gray-800">Estoque</h1>

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
        {["Todos", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1 rounded cursor-pointer transition-colors ${
              filter === cat ? "bg-black text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* TELA VAZIA */}
      {filteredProducts.length === 0 && (
        <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-gray-400 text-7xl mb-4">📦</div>

          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Que tal começarmos adicionando um produto?
          </h2>

          <p className="text-gray-500 mb-6 max-w-sm">
            Parece que seu estoque ainda está vazio. Adicione seu primeiro item para começar.
          </p>

          <button
            onClick={() => navigate("/estoque/novoproduto")}
            className="px-6 py-3 bg-black text-white font-medium rounded-lg cursor-pointer shadow hover:bg-gray-900 transition"
          >
            Adicionar Produto
          </button>
        </div>
      )}

      <ProductCard products={filteredProducts} onSelect={(p) => setSelectedProduct(p)} />

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
          onRemove={async (productId: string, qty: number, date?: string) => {
            await handleRemoveProduct(productId, qty, false, date);
          }}
          onClose={() => setShowRemoveModal(false)}
        />
      )}

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onRemove={async (productId: string, removeEntire?: boolean) => {
            await handleRemoveProduct(productId, undefined, removeEntire);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
