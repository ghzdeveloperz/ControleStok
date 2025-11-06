// src/components/modals/ModalRemoveProduct.tsx
import React, { useState } from "react";
import { Product } from "../ProductCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { saveMovement } from "../../db";

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
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<Product["id"] | null>(
    products.length > 0 ? products[0].id : null
  );
  const [quantity, setQuantity] = useState<number | "">("");
  const [exitDate, setExitDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRemove = async () => {
    if (!selectedProductId || quantity === "" || !exitDate) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (Number(quantity) > product.quantity) {
      alert(`Não é possível remover mais que ${product.quantity} unidades.`);
      return;
    }

    setLoading(true);
    const dateStr = exitDate.toISOString().split("T")[0];

    // chama função do pai para atualizar quantidade
    onRemove(selectedProductId, Number(quantity), dateStr);

    // salva movimentação no DB
    try {
      await saveMovement({
        productId: selectedProductId,
        productName: product.name,
        quantity: Number(quantity),
        type: "remove",
        date: dateStr,
      });
    } catch (err) {
      console.error("Erro ao salvar movimentação:", err);
    } finally {
      setLoading(false);
      // reset campos
      setQuantity("");
      setExitDate(null);
      setSelectedProductId(filteredProducts[0]?.id ?? null);
      setSearch("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
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
            value={selectedProductId ?? ""}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="cursor-pointer px-3 py-2 border rounded w-full"
          >
            {filteredProducts.map((p) => (
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

          <DatePicker
            selected={exitDate}
            onChange={(date: Date | null) => setExitDate(date)}
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
