// src/components/modals/ModalAddProduct.tsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCamera } from "react-icons/fa";

import { Product } from "../../ProductCard";
import { ModalScanner } from "../scanner/ModalScanner";
import { findProductByBarcode } from "../../../firebase/firestore/products";
import { auth as firebaseAuth } from "../../../firebase/firebase";
import { AlertBanner } from "../../AlertBanner";

interface ModalAddProductProps {
  products: Product[];
  onClose: () => void;
  onAdd: (
    productId: Product["id"],
    quantity: number,
    entryDate: string,
    newAvgCost: number,
    unitPrice: number
  ) => void;
}

export const ModalAddProduct: React.FC<ModalAddProductProps> = ({
  products,
  onClose,
  onAdd,
}) => {
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length > 0 ? products[0].id : ""
  );
  const [quantity, setQuantity] = useState<number | "">("");
  const [entryDate, setEntryDate] = useState<Date | null>(null);
  const [price, setPrice] = useState("");
  const [keepSamePrice, setKeepSamePrice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error"; key: number } | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  // ---------------- FILTRO ----------------
  const filteredProducts = localProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedProduct = localProducts.find((p) => p.id === selectedProductId);

  useEffect(() => {
    if (!filteredProducts.some((p) => p.id === selectedProductId)) {
      setSelectedProductId(filteredProducts.length ? filteredProducts[0].id : "");
    }
  }, [search, filteredProducts, selectedProductId]);

  // ---------------- ALERT ----------------
  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type, key: alertKey });
    setAlertKey((prev) => prev + 1);
  };

  // ---------------- FORMATAÇÃO MOEDA ----------------
  const formatCurrency = (value: string) => {
    const clean = value.replace(/\D/g, "");
    const number = Number(clean) / 100;
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const parseCurrency = (formatted: string) => Number(formatted.replace(/\D/g, "")) / 100;

  // ---------------- PREÇO ----------------
  const handleTogglePrice = () => {
    if (keepSamePrice) setShowPriceConfirm(true);
    else {
      setKeepSamePrice(true);
      setPrice("");
    }
  };

  const confirmPriceChange = () => {
    setKeepSamePrice(false);
    setShowPriceConfirm(false);
    if (selectedProduct?.unitPrice) {
      setPrice(
        selectedProduct.unitPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      );
    }
  };

  const cancelPriceChange = () => {
    setKeepSamePrice(true);
    setShowPriceConfirm(false);
  };

  // ---------------- GET USER ID ----------------
  const resolveUserId = (): string => {
    const tryKeys = ["loggedUser", "loggedInUser", "userId", "loggedUserId", "uid", "user", "currentUserId"];
    for (const k of tryKeys) {
      const v = localStorage.getItem(k);
      if (v) return v.trim();
    }
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.uid) return parsed.uid;
        if (parsed?.id) return parsed.id;
      }
    } catch { }
    try {
      const firebaseUid = firebaseAuth?.currentUser?.uid;
      if (firebaseUid) return firebaseUid;
    } catch { }
    return "";
  };

  // ---------------- NORMALIZAÇÃO ----------------
  const normalizeProduct = (p: any): Product => ({
    id: String(p.id),
    name: p.name ?? "",
    barcode: String(p.barcode ?? ""),
    category: p.category ?? "",
    cost: Number(p.cost ?? 0),
    unitPrice: Number(p.unitPrice ?? p.cost ?? 0),
    price: Number(p.price ?? p.unitPrice ?? p.cost ?? 0),
    quantity: Number(p.quantity ?? 0),
    minStock: Number(p.minStock ?? 0),
    image: p.image ?? "",
  });

  // ---------------- SCANNER ----------------
  const handleDetected = async (barcodeRaw: string) => {
    setScannerOpen(false);
    const barcode = String(barcodeRaw ?? "").trim();
    if (!barcode) {
      showAlert("Código inválido.", "error");
      return;
    }

    const userId = resolveUserId();
    if (!userId) {
      showAlert("Usuário não encontrado. Faça login novamente.", "error");
      return;
    }

    try {
      const productRaw = await findProductByBarcode(userId, barcode);
      if (!productRaw) {
        showAlert("Código não encontrado.", "error");
        return;
      }

      const product = normalizeProduct(productRaw);

      const exists = localProducts.some((p) => p.id === product.id);
      if (!exists) setLocalProducts(prev => [...prev, product]);

      setSearch(product.barcode ?? "");
      setSelectedProductId(product.id);
      showAlert(`Produto encontrado: ${product.name}`, "success");
    } catch (err) {
      console.error(err);
      showAlert("Erro ao buscar produto.", "error");
    }
  };

  // ---------------- ADICIONAR ----------------
  const handleAdd = async () => {
    if (!selectedProductId || quantity === "" || !entryDate) return;

    const prod = localProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qty = Number(quantity);
    const loteCost = keepSamePrice ? prod.unitPrice ?? prod.price : parseCurrency(price);
    if (!keepSamePrice && price.trim() === "") return;

    const dateStr = entryDate.toISOString().split("T")[0];
    const oldQty = prod.quantity ?? 0;
    const oldCost = prod.price ?? 0;
    const newAvgCost = (oldQty * oldCost + qty * loteCost) / (oldQty + qty);

    prod.unitPrice = loteCost;

    onAdd(selectedProductId, qty, dateStr, newAvgCost, loteCost);
    onClose();
  };

  // ---------------- JSX ----------------
  return (
    <>
      <ModalScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onResult={handleDetected} />
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
          {alert && <AlertBanner key={alert.key} message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
          <h2 className="text-xl font-bold mb-4">Adicionar Produto</h2>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 border rounded w-full"
              />
              <button onClick={() => setScannerOpen(true)} className="p-3 bg-black text-white rounded-xl">
                <FaCamera />
              </button>
            </div>

            <select
              value={selectedProductId ?? ""}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="cursor-pointer px-3 py-2 border rounded w-full"
            >
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} • {p.barcode} • Estoque: {p.quantity}
                </option>
              ))}
            </select>

            {selectedProduct && (
              <p className="text-sm text-gray-600">
                Preço atual:{" "}
                <span className="font-semibold">
                  {selectedProduct.unitPrice?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "R$ 0,00"}
                </span>
              </p>
            )}

            <input
              type="number"
              placeholder="Quantidade"
              value={quantity === "" ? "" : String(quantity)}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              className="cursor-text px-3 py-2 border rounded w-full"
              min={1}
            />

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={keepSamePrice} onChange={handleTogglePrice} />
              Permanecer mesmo preço
            </label>

            {!keepSamePrice && (
              <input
                type="text"
                placeholder="Valor do Produto (R$)"
                value={price}
                onChange={(e) => setPrice(formatCurrency(e.target.value))}
                className="cursor-text px-3 py-2 border rounded w-full"
              />
            )}

            <DatePicker
              selected={entryDate}
              onChange={(date: Date | null) => setEntryDate(date)}
              className="cursor-pointer px-3 py-2 border rounded w-full"
              placeholderText="Escolha a data de entrada"
              dateFormat="yyyy-MM-dd"
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="cursor-pointer px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" disabled={loading}>
              Cancelar
            </button>
            <button onClick={handleAdd} className="cursor-pointer px-4 py-2 bg-lime-900 text-white rounded hover:bg-green-700" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </div>

        {showPriceConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-5 rounded-lg shadow-xl w-80 flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-gray-800 text-center">Alterar preço do produto?</h3>
              <p className="text-sm text-gray-600 text-center">Esta ação permitirá definir um novo valor unitário.</p>
              <div className="flex gap-3 mt-3">
                <button className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 cursor-pointer" onClick={cancelPriceChange}>
                  Cancelar
                </button>
                <button className="flex-1 bg-lime-700 text-white py-2 rounded-lg hover:bg-lime-800 cursor-pointer" onClick={confirmPriceChange}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
