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

  // -------------------------------
  // CATEGORIAS
  // -------------------------------
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
    const number = Number(clean) / 100;
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const parseCurrency = (formatted: string) => {
    const clean = formatted.replace(/\D/g, "");
    const number = Number(clean) / 100;
    return isNaN(number) ? 0 : number;
  };

  const capitalize = (text: string) =>
    text
      ? text
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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

  // -------------------------------
  // SALVAR PRODUTO
  // -------------------------------
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

    // ❗ Verificar nome duplicado
    const alreadyExists = await productExists(finalName);
    if (alreadyExists) {
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
      const productRef = await saveProduct(newProduct);

      if (parsedQuantity > 0) {
        await addProductToStock(
          productRef.id,
          newProduct.name,
          parsedQuantity,
          parsedPrice,
          parsedPrice
        );
      }

      setAlert({ message: "Produto adicionado!", type: "success" });
      navigate("/estoque");
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      setAlert({ message: "Erro ao salvar!", type: "error" });
    }

    setLoading(false);
  };

  const handleAddCategory = async (name: string) => {
    const capitalized = capitalize(name);
    if (!categoriasExistentes.includes(capitalized)) {
      await saveCategory(capitalized);
    }
    setCategory(capitalized);
    setModalOpen(false);
  };

  return (
    <div className="p-8 w-full">
      {alert && (
        <AlertBanner
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <h1 className="text-3xl font-semibold mb-8">Adicionar Novo Produto</h1>

      <div className="flex flex-col gap-8 w-full">
        {/* IMAGEM */}
        <div className="w-full flex flex-col items-center bg-white shadow-sm rounded-2xl p-6 border border-gray-200">
          {preview ? (
            <img
              src={preview}
              alt="Prévia"
              className="w-full max-w-sm h-64 object-cover rounded-xl shadow-md"
            />
          ) : (
            <label className="w-full max-w-sm h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-lime-600 hover:bg-gray-100 cursor-pointer transition">
              <FaPlus className="text-gray-400 text-5xl mb-2" />
              <span className="text-gray-500 text-sm font-medium">Selecionar imagem</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
          )}

          {preview && (
            <label className="mt-4 cursor-pointer text-sm text-lime-900 font-semibold hover:underline">
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

        {/* FORM */}
        <div className="flex-1 bg-white shadow-sm rounded-2xl p-8 border border-gray-200">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Nome do produto</span>
              <input
                type="text"
                placeholder="Ex: Coca-Cola Lata"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black/10 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-gray-700">Categoria</span>
              <div className="flex gap-3 flex-wrap">
                {categoriasExistentes.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-xl border transition cursor-pointer ${
                      category === cat
                        ? "bg-lime-900 text-white border-lime-900"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}

                <button
                  onClick={() => setModalOpen(true)}
                  className="w-12 h-12 rounded-xl border border-gray-300 bg-gray-100 flex items-center justify-center text-xl text-gray-500 hover:bg-gray-200 transition cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

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
                className="px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black/10 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Preço (R$)</span>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={price}
                onChange={(e) => setPrice(formatCurrency(e.target.value))}
                className="px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black/10 outline-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-lime-900 text-white hover:bg-lime-800 transition cursor-pointer"
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
