"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaCamera } from "react-icons/fa";

import { ModalAddCategory } from "../components/modals/ModalAddCategory";
import { ModalScanner } from "../components/modals/ModalScanner";
import { AlertBanner } from "../components/AlertBanner";

import {
  saveProductForUser,
  getProductsForUser,
  ProductQuantity,
} from "../firebase/firestore/products";

import { saveMovementForUser } from "../firebase/firestore/movements";

import {
  getCategoriesForUser,
  saveCategoryForUser,
  onCategoriesUpdateForUser,
} from "../firebase/firestore/categories";

interface NovoProdutoProps {
  userId: string;
}

export const NovoProduto: React.FC<NovoProdutoProps> = ({ userId }) => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [barcode, setBarcode] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [price, setPrice] = useState<string>("");
  const [minStock, setMinStock] = useState<number | "">("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // ------------------------------
  // FETCH CATEGORIES
  // ------------------------------
  useEffect(() => {
    const fetchCats = async () => {
      const cats = await getCategoriesForUser(userId);
      setCategoriasExistentes(cats);
    };
    fetchCats();
    const unsub = onCategoriesUpdateForUser(userId, (cats) => setCategoriasExistentes(cats));
    return () => unsub();
  }, [userId]);

  // ------------------------------
  // UTILS
  // ------------------------------
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

  // ------------------------------
  // SAVE PRODUCT
  // ------------------------------
  const handleSave = async () => {
    if (!name || !category || !barcode || quantity === "" || price === "") {
      setAlert({
        message: "Preencha todos os campos, incluindo o código de barras!",
        type: "error",
      });
      return;
    }

    setLoading(true);

    const parsedPrice = parseCurrency(price);
    const parsedQuantity = Number(quantity) || 0;
    const finalName = capitalize(name);
    const finalCategory = capitalize(category);

    try {
      const allProducts = await getProductsForUser(userId);

      const exists = allProducts.some(
        (p) => p.name.toLowerCase() === finalName.toLowerCase()
      );
      if (exists) {
        setAlert({ message: "Já existe um produto com esse nome!", type: "error" });
        setLoading(false);
        return;
      }

      const barcodeExists = allProducts.some((p) => p.barcode && p.barcode === barcode);
      if (barcodeExists) {
        setAlert({ message: "Já existe um produto com esse código de barras!", type: "error" });
        setLoading(false);
        return;
      }

      const newProduct: Omit<ProductQuantity, "id"> = {
        name: finalName,
        category: finalCategory,
        quantity: parsedQuantity,
        cost: parsedPrice,
        unitPrice: parsedPrice,
        price: parsedPrice,
        image: preview ?? undefined,
        minStock: Number(minStock || 10),
        barcode,
      };
      console.log("Barcode que será salvo:", barcode);
      const productId = await saveProductForUser(userId, newProduct);

      if (parsedQuantity > 0) {
        const today = new Date();
        const dateString = today.toISOString().split("T")[0];

        await saveMovementForUser(userId, {
          productId,
          productName: finalName,
          quantity: parsedQuantity,
          cost: parsedPrice,
          unitPrice: parsedPrice,
          type: "add",
          date: dateString,
        });
      }

      setAlert({ message: "Produto adicionado com sucesso!", type: "success" });
      navigate("/estoque");
    } catch (err) {
      console.error(err);
      setAlert({ message: "Erro ao salvar produto!", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // ADD CATEGORY
  // ------------------------------
  const handleAddCategory = async (name: string) => {
    const formatted = capitalize(name);
    if (!categoriasExistentes.includes(formatted)) {
      await saveCategoryForUser(userId, formatted);
    }
    setCategory(formatted);
    setModalOpen(false);
  };

  // ------------------------------
  // JSX
  // ------------------------------
  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto">
      {alert && (
        <AlertBanner
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <h1 className="text-2xl sm:text-3xl font-semibold mb-6">Adicionar Novo Produto</h1>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

        {/* IMAGE UPLOAD */}
        <div className="w-full lg:w-1/2 flex flex-col items-center bg-white shadow-sm rounded-2xl p-4 border border-gray-200">
          {preview ? (
            <img
              src={preview}
              alt="Prévia"
              className="w-full max-w-xs h-52 object-cover rounded-xl shadow-md"
            />
          ) : (
            <label className="w-full max-w-xs h-52 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-pointer">
              <FaPlus className="text-gray-400 text-4xl mb-2" />
              <span className="text-gray-500 text-sm">Selecionar imagem</span>
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
        <div className="w-full lg:w-1/2 bg-white shadow-sm rounded-2xl p-4 border border-gray-200">
          <div className="flex flex-col gap-6">

            {/* NAME */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Nome do produto</span>
              <input
                type="text"
                placeholder="Ex: Coca-Cola"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 outline-none"
              />
            </div>

            {/* BARCODE */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Código de barras</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digite ou escaneie"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 outline-none"
                />
                <button
                  onClick={() => setScannerOpen(true)}
                  className="p-3 bg-lime-900 text-white rounded-xl hover:bg-lime-800"
                >
                  <FaCamera />
                </button>
              </div>
            </div>

            <ModalScanner
              open={scannerOpen}
              onClose={() => setScannerOpen(false)}
              onResult={(code) => setBarcode(code)}
            />

            {/* CATEGORY */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Categoria</span>
              <div className="flex flex-wrap gap-3 items-start max-h-40 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible">
                <button
                  onClick={() => setModalOpen(true)}
                  className="min-w-12 h-12 rounded-xl border border-gray-300 bg-gray-100 flex items-center justify-center text-xl text-gray-500"
                >
                  +
                </button>

                {categoriasExistentes.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-xl border whitespace-nowrap ${category === cat
                        ? "bg-lime-900 text-white border-lime-900"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* QUANTITY */}
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
                className="px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 outline-none"
              />
            </div>

            {/* PRICE */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">Preço (R$)</span>
              <input
                type="text"
                placeholder="R$ 0,00"
                value={price}
                onChange={(e) => setPrice(formatCurrency(e.target.value))}
                className="px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-lime-900 text-white hover:bg-lime-800"
            >
              {loading ? "Salvando..." : "Adicionar Produto"}
            </button>
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
