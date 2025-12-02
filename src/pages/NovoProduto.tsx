// src/pages/NovoProduto.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import { ModalAddCategory } from "../components/modals/ModalAddCategory";
import { AlertBanner } from "../components/AlertBanner";

import {
  saveProduct,
  ProductQuantity,
  addProductToStock,
  getCategories,
  saveCategory,
  onCategoriesUpdate,
  productExists,
} from "../firebase/firestore/products";

export const NovoProduto: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [price, setPrice] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      const cats = await getCategories();
      setCategoriasExistentes(cats);
    };
    fetchCats();

    const unsub = onCategoriesUpdate((cats) => setCategoriasExistentes(cats));
    return () => unsub();
  }, []);

  const formatCurrency = (value: string) => {
    const clean = value.replace(/\D/g, "");
    const num = Number(clean) / 100;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const parseCurrency = (formatted: string) => {
    const clean = formatted.replace(/\D/g, "");
    const num = Number(clean) / 100;
    return isNaN(num) ? 0 : num;
  };

  const capitalize = (t: string) =>
    t
      ? t
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : "";

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else setPreview(null);
  };

  const handleSave = async () => {
    if (!name || !category || quantity === "" || price === "") {
      setAlert({ message: "Preencha todos os campos!", type: "error" });
      return;
    }

    setLoading(true);

    const parsedPrice = parseCurrency(price);
    const parsedQuantity = Number(quantity) || 0;
    const finalName = capitalize(name);
    const finalCategory = capitalize(category);

    const exists = await productExists(finalName);
    if (exists) {
      setAlert({ message: "Já existe um produto com esse nome!", type: "error" });
      setLoading(false);
      return;
    }

    const newProduct: Omit<ProductQuantity, "id"> = {
      name: finalName,
      category: finalCategory,
      quantity: 0,
      cost: parsedPrice,
      unitPrice: parsedPrice,
      image: preview ? String(preview) : null,
      minStock: 0,
    };

    try {
      const ref = await saveProduct(newProduct);

      if (parsedQuantity > 0) {
        // ⏰ Ajuste para salvar a data no horário de Brasília
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = now.getFullYear();
        const dateStr = `${year}-${month}-${day}`;

        await addProductToStock(ref.id, newProduct.name, parsedQuantity, parsedPrice, parsedPrice, dateStr);
      }

      setAlert({ message: "Produto adicionado!", type: "success" });
      navigate("/estoque");
    } catch (err) {
      console.error(err);
      setAlert({ message: "Erro ao salvar!", type: "error" });
    }

    setLoading(false);
  };

  const handleAddCategory = async (name: string) => {
    const formatted = capitalize(name);
    if (!categoriasExistentes.includes(formatted)) {
      await saveCategory(formatted);
    }
    setCategory(formatted);
    setModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto">
      {alert && (
        <AlertBanner
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <h1 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-center sm:text-left">
        Adicionar Novo Produto
      </h1>

      {/* LAYOUT RESPONSIVO */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

        {/* IMAGEM */}
        <div className="w-full lg:w-1/2 flex flex-col items-center bg-white shadow-sm rounded-2xl p-4 sm:p-6 border border-gray-200">
          {preview ? (
            <img
              src={preview}
              alt="Prévia"
              className="w-full max-w-xs sm:max-w-sm h-52 sm:h-64 object-cover rounded-xl shadow-md"
            />
          ) : (
            <label className="w-full max-w-xs sm:max-w-sm h-52 sm:h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-lime-600 hover:bg-gray-100 cursor-pointer transition">
              <FaPlus className="text-gray-400 text-4xl sm:text-5xl mb-2" />
              <span className="text-gray-500 text-xs sm:text-sm font-medium">Selecionar imagem</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          )}

          {preview && (
            <label className="mt-3 cursor-pointer text-sm text-lime-900 font-semibold hover:underline">
              Trocar imagem
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* FORMULÁRIO */}
        <div className="w-full lg:w-1/2 bg-white shadow-sm rounded-2xl p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col gap-6">

            {/* NOME */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Nome do produto</span>
              <input
                type="text"
                placeholder="Ex: Coca-Cola Lata"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black/10 outline-none"
              />
            </div>

            {/* CATEGORIAS */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Categoria</span>

              <div className="flex gap-3 overflow-x-auto no-scrollbar flex-nowrap py-1">
                {categoriasExistentes.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-xl border whitespace-nowrap transition ${
                      category === cat
                        ? "bg-lime-900 text-white border-lime-900"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                <button
                  onClick={() => setModalOpen(true)}
                  className="min-w-12 h-12 rounded-xl border border-gray-300 bg-gray-100 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-200 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* QUANTIDADE */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Quantidade inicial</span>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={quantity === "" ? "" : quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black/10 outline-none"
              />
            </div>

            {/* PREÇO */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Preço (R$)</span>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={price}
                onChange={(e) => setPrice(formatCurrency(e.target.value))}
                className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black/10 outline-none"
              />
            </div>

            {/* BOTÃO */}
            <div className="flex justify-end pt-2 sm:pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-5 py-2 sm:px-6 sm:py-3 rounded-xl bg-lime-900 text-white hover:bg-lime-800 transition"
              >
                {loading ? "Salvando..." : "Adicionar Produto"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ModalAddCategory
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddCategory={handleAddCategory}
        existingCategories={categoriasExistentes}
      />
    </div>
  );
};
