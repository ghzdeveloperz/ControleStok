import React, { useState, useEffect } from "react";
import { Product } from "../ProductCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AlertBanner } from "../../components/AlertBanner";

interface ModalRemoveProductProps {
  products: Product[];
  onClose: () => void;
  onRemove: (productId: string, quantity: number, date: string) => Promise<void>;
}

export const ModalRemoveProduct: React.FC<ModalRemoveProductProps> = ({
  products,
  onClose,
  onRemove,
}) => {
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length > 0 ? String(products[0].id) : ""
  );
  const [quantity, setQuantity] = useState<number | "">("");
  const [exitDate, setExitDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  // Estado do alerta
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error"; key: number } | null>(null);
  const [alertKey, setAlertKey] = useState(0); // Para forçar re-render do mesmo alerta

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (filteredProducts.length > 0) {
      setSelectedProductId(String(filteredProducts[0].id));
    } else {
      setSelectedProductId("");
    }
  }, [search, products]);

  useEffect(() => {
    if (products.length > 0 && !products.find(p => String(p.id) === selectedProductId)) {
      setSelectedProductId(String(products[0].id));
    }
  }, [products, selectedProductId]);

  const showAlert = (message: string, type: "success" | "error") => {
    setAlert({ message, type, key: alertKey });
    setAlertKey((prev) => prev + 1);
  };

  const handleRemove = async () => {
    if (!selectedProductId || quantity === "") {
      showAlert("Selecione um produto e uma quantidade.", "error");
      return;
    }

    if (!exitDate) {
      showAlert("A data de saída é obrigatória.", "error");
      return;
    }

    const product = products.find((p) => String(p.id) === selectedProductId);
    if (!product) return;

    if (Number(quantity) > product.quantity) {
      showAlert(`Não é possível remover mais que ${product.quantity} unidades.`, "error");
      return;
    }

    setLoading(true);

    const dateStr = exitDate.toISOString().split("T")[0];

    try {
      await onRemove(selectedProductId, Number(quantity), dateStr);

      setQuantity("");
      setExitDate(null);
      setSearch("");
      setSelectedProductId(filteredProducts[0]?.id ?? "");
      showAlert("Produto removido com sucesso!", "success");
      onClose();
    } catch (err) {
      console.error("Erro ao remover item:", err);
      showAlert("Erro ao remover produto. Veja console.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
        {/* ALERTA */}
        {alert && (
          <AlertBanner
            key={alert.key}
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        <h2 className="text-xl font-bold mb-4">Remover Produto</h2>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cursor-text px-3 py-2 border rounded w-full"
          />

          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="cursor-pointer px-3 py-2 border rounded w-full"
          >
            {filteredProducts.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name} (Em estoque: {p.quantity})
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Quantidade a remover"
            value={quantity === "" ? "" : String(quantity)}
            onChange={(e) =>
              setQuantity(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="cursor-text px-3 py-2 border rounded w-full"
            min={1}
          />

          <DatePicker
            selected={exitDate}
            onChange={(date) => setExitDate(date)}
            className="cursor-pointer px-3 py-2 border rounded w-full"
            placeholderText="Escolha a data de saída"
            dateFormat="yyyy-MM-dd"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2 flex-wrap">
          <button
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-red-800 text-white rounded hover:bg-red-700 transition"
          >
            {loading ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
};
