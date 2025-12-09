/* src/pages/Estoque.tsx */
"use client";

import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { ProductCard, Product } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/ModalRemoveProduct";
import { ProductDetailsModal } from "../components/modals/ProductDetailsModal";
=======
import { ProductCard } from "../components/ProductCard";
import { ModalAddProduct } from "../components/modals/movements/ModalAddProduct";
import { ModalRemoveProduct } from "../components/modals/movements/ModalRemoveProduct";
import { ProductDetailsModal } from "../components/modals/products_details/ProductDetailsModal";
>>>>>>> scanner
import { AlertBanner } from "../components/AlertBanner";

// products.ts
import { removeProductForUser } from "../firebase/firestore/products";

// movements.ts
import { saveMovementForUser } from "../firebase/firestore/movements";

// categories.ts
import { getCategoriesForUser, onCategoriesUpdateForUser } from "../firebase/firestore/categories";

import { useProducts } from "../hooks/useProducts";
import { useNavigate } from "react-router-dom";

<<<<<<< HEAD
// Firestore direct updates (usado para atualizar quantity/unitPrice/cost)
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

interface EstoqueProps {
  userId: string;
}
=======
// Firestore direct updates
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
>>>>>>> scanner

// ---------------- UTILS ----------------
const getLocalDate = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
};

// ---------------- TIPOS ----------------
export interface ProductModalType {
  id: string;
  name: string;
  barcode: string;
  category: string;
  cost: number;
  unitPrice: number;
  price: number;
  quantity: number;
  minStock: number;
  image: string;
}

// ---------------- COMPONENTE ----------------
interface EstoqueProps {
  userId: string;
}

export default function Estoque({ userId }: EstoqueProps) {
  const navigate = useNavigate();
  const { products: rawProducts, loading } = useProducts(userId);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
<<<<<<< HEAD
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
=======
  const [selectedProduct, setSelectedProduct] = useState<ProductModalType | null>(null);
>>>>>>> scanner

  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [categories, setCategories] = useState<string[]>([]);

<<<<<<< HEAD
  // Carrega categorias (se existir coleção)
=======
  // Carrega categorias
>>>>>>> scanner
  useEffect(() => {
    let unsub: (() => void) | undefined;

    const fetchCats = async () => {
      try {
        const cats = await getCategoriesForUser(userId);
        setCategories(cats);
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
        setCategories([]);
      }
    };

    fetchCats();

    try {
<<<<<<< HEAD
      unsub = onCategoriesUpdateForUser(userId, (cats) => {
        setCategories(cats);
      });
=======
      unsub = onCategoriesUpdateForUser(userId, (cats) => setCategories(cats));
>>>>>>> scanner
    } catch (err) {
      console.error("Erro ao inscrever em categorias:", err);
    }

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [userId]);

<<<<<<< HEAD
  // Padronização dos produtos (normaliza o rawProducts do hook)
  const products: Product[] = rawProducts.map((p) => ({
=======
  // ---------------- NORMALIZAÇÃO ----------------
  const products: ProductModalType[] = rawProducts.map((p) => ({
>>>>>>> scanner
    id: p.id,
    name: p.name ?? "Sem nome",
    quantity: Number(p.quantity ?? 0),
    price: Number(p.price ?? 0),
    unitPrice: Number(p.unitPrice ?? 0),
    category: p.category ?? "Sem categoria",
    minStock: Number(p.minStock ?? 0),
    image: p.image ?? "/images/placeholder.png",
<<<<<<< HEAD

    // Campo auxiliar apenas no front-end
    cost: Number(p.price ?? 0),
=======
    // FRONT-END gera cost a partir do price se não existir
    cost: Number(p.unitPrice ?? p.price ?? 0),
    barcode: p.barcode ?? "SEM_CODIGO",
>>>>>>> scanner
  }));


  // Filtro + busca
  const filteredProducts = products.filter((product) => {
    const matchesCategory = filter === "Todos" || product.category === filter;
<<<<<<< HEAD
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

=======
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
>>>>>>> scanner
    return matchesCategory && matchesSearch;
  });

  const showTimedAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 2000);
  };

<<<<<<< HEAD
  // -----------------------------
  // ADICIONAR QUANTIDADE
  // -----------------------------
=======
  // ---------------- ADD ----------------
>>>>>>> scanner
  const handleAddProduct = async (
    productId: string,
    quantity: number,
    date: string,
    cost: number,
    unitPrice?: number
  ) => {
    const product = products.find((p) => p.id === productId);
<<<<<<< HEAD
    if (!product) {
      showTimedAlert("Produto não encontrado.", "error");
      return;
    }
=======
    if (!product) return showTimedAlert("Produto não encontrado.", "error");
>>>>>>> scanner

    try {
      const payload = {
        productId,
        productName: product.name,
        quantity,
        type: "add" as const,
        date,
        cost,
        unitPrice: unitPrice ?? cost,
      } as any;

      // 1) salva movimentação
      await saveMovementForUser(userId, payload);

<<<<<<< HEAD
      // 2) atualiza o documento do produto no Firestore (quantidade e preços)
      const prodRef = doc(db, "users", userId, "products", productId);

      // calculo do novo custo médio aqui se você desejar usar newAvgCost:
      // como o frontend já calcula newAvgCost em ModalAddProduct, o valor enviado
      // via 'cost' pode representar o novo custo médio. Aqui eu aplico o valor
      // recebido (cost) como price/cost/unitPrice conforme lógica do seu app.
      // Se você quiser calcular pelo histórico, remova esse comportamento.
      await updateDoc(prodRef, {
        quantity: product.quantity + quantity,
        cost: cost,
        unitPrice: unitPrice ?? cost,
        price: cost, // alimentar price também (opcional, compatibilidade)
=======
      const prodRef = doc(db, "users", userId, "products", productId);
      await updateDoc(prodRef, {
        quantity: product.quantity + quantity,
        cost,
        unitPrice: unitPrice ?? cost,
        price: cost,
>>>>>>> scanner
      } as any);

      showTimedAlert("Produto adicionado!", "success");
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
      showTimedAlert("Erro ao adicionar!", "error");
    }
  };

<<<<<<< HEAD
  // -----------------------------
  // REMOVER QUANTIDADE OU EXCLUIR
  // -----------------------------
=======
  // ---------------- REMOVE ----------------
>>>>>>> scanner
  const handleRemoveProduct = async (
    productId: string,
    qty?: number,
    removeEntire?: boolean,
    exitDate?: string
  ) => {
    const product = products.find((p) => p.id === productId);
<<<<<<< HEAD
    if (!product) {
      showTimedAlert("Produto não encontrado.", "error");
      return;
    }
=======
    if (!product) return showTimedAlert("Produto não encontrado.", "error");
>>>>>>> scanner

    try {
      if (removeEntire) {
        await removeProductForUser(userId, productId);
        showTimedAlert("Produto excluído do estoque!", "error");
        return;
      }

      if (qty && qty > 0) {
        if (qty > product.quantity) {
          showTimedAlert(`Não é possível remover mais que ${product.quantity} unidades.`, "error");
          return;
        }

        const payload = {
          productId,
          productName: product.name,
          quantity: qty,
          type: "remove" as const,
          date: exitDate ?? getLocalDate(),
<<<<<<< HEAD
          // Use unitPrice como referência do custo da saída
=======
>>>>>>> scanner
          cost: product.unitPrice,
          unitPrice: product.unitPrice,
        } as any;

        // 1) salva movimentação
        await saveMovementForUser(userId, payload);

<<<<<<< HEAD
        // 2) atualiza produto no Firestore:
        const prodRef = doc(db, "users", userId, "products", productId);
        await updateDoc(prodRef, {
          quantity: product.quantity - qty,
        } as any);
=======
        const prodRef = doc(db, "users", userId, "products", productId);
        await updateDoc(prodRef, { quantity: product.quantity - qty } as any);
>>>>>>> scanner

        showTimedAlert("Quantidade removida!", "error");
      }
    } catch (err) {
      console.error("Erro ao remover produto:", err);
      showTimedAlert("Erro ao remover!", "error");
    }
  };

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
      {alert && <AlertBanner {...alert} onClose={() => setAlert(null)} />}

      <div className="flex justify-between items-center mb-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-800">Estoque</h1>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-lime-900 text-white rounded cursor-pointer">
            Adicionar
          </button>
          <button onClick={() => setShowRemoveModal(true)} className="px-4 py-2 bg-red-800 text-white rounded cursor-pointer">
            Remover
          </button>
        </div>
      </div>

      <input type="text" placeholder="Buscar produto..." className="border p-2 rounded w-full mb-4" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="flex gap-2 mb-6 flex-wrap">
        {["Todos", ...categories].map((cat) => (
<<<<<<< HEAD
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1 rounded cursor-pointer transition ${
              filter === cat ? "bg-black text-white" : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
=======
          <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1 rounded cursor-pointer transition ${filter === cat ? "bg-black text-white" : "bg-gray-200 hover:bg-gray-300"}`}>
>>>>>>> scanner
            {cat}
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
<<<<<<< HEAD
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
=======
          <div className="flex items-center justify-center w-24 h-24 bg-gray-200 text-gray-800 rounded-full mb-4 text-5xl shadow-sm">📦</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Que tal começarmos adicionando um produto?</h2>
          <p className="text-gray-500 mb-6 max-w-md">Parece que seu estoque ainda está vazio. Adicione seu primeiro item para começar.</p>
          <button onClick={() => navigate("/estoque/novoproduto")} className="px-6 py-3 bg-black text-white font-medium rounded-lg shadow hover:bg-gray-900 transition cursor-pointer">
>>>>>>> scanner
            Adicionar Produto
          </button>
        </div>
      )}

<<<<<<< HEAD
      {/* Lista de produtos */}
      <ProductCard userId={userId} products={filteredProducts} onSelect={(p) => setSelectedProduct(p)} />

      {/* Modal adicionar */}
      {showAddModal && (
        <ModalAddProduct products={products} onAdd={handleAddProduct} onClose={() => setShowAddModal(false)} />
      )}
=======
      <ProductCard userId={userId} products={filteredProducts} onSelect={(p) => setSelectedProduct(p as ProductModalType)} />

      {showAddModal && <ModalAddProduct products={products} onAdd={handleAddProduct} onClose={() => setShowAddModal(false)} />}
>>>>>>> scanner

      {showRemoveModal && (
        <ModalRemoveProduct
          products={products} // ✅ Agora todos produtos têm barcode obrigatório
          onRemove={async (productId: string, qty: number, date?: string) => await handleRemoveProduct(productId, qty, false, date)}
          onClose={() => setShowRemoveModal(false)}
        />
      )}

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
    </div>
  );
}
