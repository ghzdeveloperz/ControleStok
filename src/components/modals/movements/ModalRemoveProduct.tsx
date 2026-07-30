// src/components/modals/ModalRemoveProduct.tsx
import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCamera } from "react-icons/fa";

import { AlertBanner } from "../../AlertBanner";
import { ModalScanner } from "../scanner/ModalScanner";
import {
  findProductByBarcode,
  type ProductQuantity,
} from "../../../firebase/firestore/products";

export interface Product {
  id: string;
  name: string;
  barcode: string; // agora obrigatório
  category?: string;
  cost?: number;
  unitPrice?: number;
  price?: number;
  quantity?: number;
  minStock?: number;
  image?: string;
}

interface ModalRemoveProductProps {
  userId: string;
  products: Product[];
  onClose: () => void;
  onRemove: (productId: string, quantity: number, date: string) => Promise<void>;
}

// ---------------- Normalizações ----------------
const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();

const normalizeProduct = (p: Product | ProductQuantity): Product => ({
  id: String(p.id),
  name: p.name ?? "",
  barcode: String(p.barcode), // obrigatório
  category: p.category ?? "",
  cost: Number(p.cost ?? 0),
  unitPrice: Number(p.unitPrice ?? p.cost ?? 0),
  price: Number(p.price ?? p.unitPrice ?? p.cost ?? 0),
  quantity: Number(p.quantity ?? 0),
  minStock: Number(p.minStock ?? 0),
  image: p.image ?? "",
});

// ---------------- COMPONENTE ----------------
export const ModalRemoveProduct: React.FC<ModalRemoveProductProps> = ({
  userId,
  products,
  onClose,
  onRemove,
}) => {
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length ? String(products[0].id) : ""
  );
  const [quantity, setQuantity] = useState<number | "">("");
  const [exitDate, setExitDate] = useState<Date | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>(() =>
    products.map(normalizeProduct)
  );
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error"; key: number; } | null>(null);
  const [alertKey, setAlertKey] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);

  // ---------------- FILTRO ----------------
  const filteredProducts = useMemo(() => {
    const term = normalize(search);
    return localProducts.filter(
      (product) =>
        normalize(product.name).includes(term) ||
        normalize(product.barcode).includes(term)
    );
  }, [localProducts, search]);

  useEffect(() => {
    if (filteredProducts.some((p) => String(p.id) === selectedProductId)) return;
    setSelectedProductId(filteredProducts.length ? String(filteredProducts[0].id) : "");
  }, [filteredProducts, selectedProductId]);

  // ---------------- ALERT ----------------
  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type, key: alertKey });
    setAlertKey((prev) => prev + 1);
  };

  // ---------------- GET USER ID ----------------
  // ---------------- SCANNER ----------------
  const handleDetected = async (barcodeRaw: string) => {
    setScannerOpen(false);
    const barcode = String(barcodeRaw ?? "").trim();
    if (!barcode) {
      showAlert("Código inválido.", "error");
      return;
    }
    if (!userId) {
      showAlert("Usuário não encontrado. Faça login novamente.", "error");
      return;
    }
    try {
      const product = await findProductByBarcode(userId, barcode);
      if (!product) {
        showAlert("Código não encontrado.", "error");
        return;
      }
      const normalized = normalizeProduct(product);
      setSearch(normalized.barcode);
      setSelectedProductId(String(normalized.id));
      const exists = localProducts.some((p) => String(p.id) === normalized.id);
      if (!exists) {
        setLocalProducts((prev) => [...prev, normalized]);
      }
      showAlert(`Produto encontrado: ${normalized.name}`, "success");
    } catch {
      showAlert("Erro ao buscar produto.", "error");
    }
  };

  // ---------------- REMOVER ----------------
  const handleRemove = async () => {
    if (!selectedProductId || quantity === "") {
      showAlert("Selecione um produto e informe a quantidade.", "error");
      return;
    }
    if (!exitDate) {
      showAlert("A data de saída é obrigatória.", "error");
      return;
    }
    const product = localProducts.find((p) => String(p.id) === selectedProductId);
    if (!product) return;
    const numericQuantity = Number(quantity);
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      showAlert("Informe uma quantidade maior que zero.", "error");
      return;
    }
    if (numericQuantity > (product.quantity ?? 0)) {
      showAlert(`Não é possível remover mais que ${product.quantity} unidades.`, "error");
      return;
    }
    setLoading(true);
    const dateStr = exitDate.toISOString().split("T")[0];
    try {
      await onRemove(selectedProductId, numericQuantity, dateStr);
      setQuantity("");
      setExitDate(null);
      setSearch("");
      setSelectedProductId(filteredProducts.length ? String(filteredProducts[0].id) : "");
      showAlert("Produto removido com sucesso!", "success");
      onClose();
    } catch {
      showAlert("Erro ao remover produto.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- JSX ----------------
  return (
    <>
      <ModalScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onResult={handleDetected} />
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
          {alert && <AlertBanner key={alert.key} message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
          <h2 className="text-xl font-bold mb-4">Remover Produto</h2>
          {/* BUSCAR */}
          <div className="flex items-center gap-2 mb-3">
            <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
            <button onClick={() => setScannerOpen(true)} className="p-3 bg-black text-white rounded-xl"><FaCamera /></button>
          </div>
          {/* SELECT */}
          <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="cursor-pointer px-3 py-2 border rounded w-full mb-3">
            {filteredProducts.length ? (
              filteredProducts.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} • {p.barcode} • Em estoque: {p.quantity}
                </option>
              ))
            ) : (
              <option value="">Nenhum produto encontrado</option>
            )}
          </select>
          {/* QUANTIDADE */}
          <input
            type="number"
            placeholder="Quantidade a remover"
            value={quantity === "" ? "" : String(quantity)}
            onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
            className="px-3 py-2 border rounded w-full mb-3"
            min={1}
          />

          {/* DATA */}
          <DatePicker
            selected={exitDate}
            onChange={(date) => setExitDate(date)}
            placeholderText="Data de saída"
            dateFormat="yyyy-MM-dd"
            wrapperClassName="w-full"
            className="w-full px-3 py-2 border rounded"
          />


          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">Cancelar</button>
            <button onClick={handleRemove} disabled={loading} className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition">{loading ? "Removendo..." : "Remover"}</button>
          </div>
        </div>
      </div>
    </>
  );
};
