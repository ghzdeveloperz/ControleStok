import React, { useState } from "react";
import { Product } from "../ProductCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ModalRemoveProductProps {
  products: Product[];
  onClose: () => void;
  onRemove: (productId: Product["id"], quantity: number, exitDate: string) => void;
}

export const ModalRemoveProduct: React.FC<ModalRemoveProductProps> = ({
  products,
  onClose,
  onRemove,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<Product["id"] | "">(
    products.length > 0 ? products[0].id : ""
  );
  const [quantity, setQuantity] = useState<number | "">("");
  const [exitDate, setExitDate] = useState<Date | null>(null);

  const handleRemove = () => {
    if (!selectedProductId || quantity === "" || !exitDate) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (quantity > product.quantity) {
      alert(`Não é possível remover mais que ${product.quantity} unidades.`);
      return;
    }

    // envia a data como string ISO
    onRemove(selectedProductId, Number(quantity), exitDate.toISOString());

    // reset campos
    setQuantity("");
    setExitDate(null);
    setSelectedProductId(products[0]?.id ?? "");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Remover Produto</h2>

        <div className="flex flex-col gap-3">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="cursor-pointer px-3 py-2 border rounded w-full"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
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

          {/* DatePicker para data de saída */}
          <DatePicker
            selected={exitDate}
            onChange={(date: Date | null) => setExitDate(date)}
            className="cursor-pointer px-3 py-2 border rounded w-full"
            placeholderText="Escolha a data de saída"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2 flex-wrap">
          <button
            onClick={onClose}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleRemove}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
};
