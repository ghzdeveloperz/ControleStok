"use client";

import React, { useState } from "react";
import { ProductCard, Product } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/ModalRemoveProduct";
import { ProductDetailsModal } from "../components/modals/ProductDetailsModal";
import { AlertBanner } from "../components/AlertBanner";
import { saveMovement, removeProduct, notifyProducts } from "../firebase/firestore/products";
import { useProducts } from "../hooks/useProducts";

export const Estoque: React.FC = () => {
  const { products: rawProducts } = useProducts();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Adaptando os produtos do Firebase para o ProductCard
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

  // --------------------------------------------
  // ADICIONAR QUANTIDADE
  // --------------------------------------------
  const handleAddProduct = async (
    productId: string,
    qty: number,
    date: string,
    newAvgCost: number,
    newUnitPrice?: number
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    await saveMovement({
      productId,
      productName: product.name ?? "Sem nome",
      quantity: qty,
      price: newUnitPrice ?? product.unitPrice ?? 0,
      cost: newAvgCost,
      type: "add",
      date,
    });

    showTimedAlert("Produto adicionado!", "success");
  };

  // --------------------------------------------
  // REMOVER QUANTIDADE OU EXCLUIR PRODUTO
  // --------------------------------------------
  const handleRemoveProduct = async (productId: string, qty?: number, removeEntire?: boolean) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    try {
      if (removeEntire) {
        // Deleta o produto inteiro do estoque
        await removeProduct(productId);

        // Atualiza lista de produtos imediatamente
        await notifyProducts();

        showTimedAlert("Produto excluído do estoque!", "error");
      } else if (qty && qty > 0) {
        // Apenas remove quantidade
        await saveMovement({
          productId,
          productName: product.name ?? "Sem nome",
          quantity: qty,
          price: product.unitPrice ?? 0,
          cost: product.price ?? 0,
          type: "remove",
          date: new Date().toISOString().split("T")[0],
        });
        showTimedAlert("Quantidade removida do produto!", "error");
      }
    } catch (err) {
      console.error("Erro ao remover produto:", err);
      showTimedAlert("Erro ao remover produto!", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6">
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
        {["Todos", "Brasileiros", "Asiáticos", "Sushi", "Limpeza", "Frios"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1 rounded ${filter === cat ? "bg-black text-white" : "bg-gray-200"}`}
          >
            {cat}
          </button>
        ))}
      </div>

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
          onRemove={async (productId: string, qty: number) => {
            await handleRemoveProduct(productId, qty);
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
};
