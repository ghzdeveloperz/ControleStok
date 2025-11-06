// src/components/modals/ModalAddProduct.tsx
import React, { useState } from "react";
import { Product } from "../ProductCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { saveMovement } from "../../db";

interface ModalAddProductProps {
  products: Product[]; // produtos existentes no estoque
  onClose: () => void;
  onAdd: (productId: Product["id"], quantity: number, entryDate: string) => void;
}

export const ModalAddProduct: React.FC<ModalAddProductProps> = ({
  products,
  onClose,
  onAdd,
}) => {
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<Product["id"] | null>(
    products.length > 0 ? products[0].id : null
  );
  const [quantity, setQuantity] = useState<number | "">("");
  const [entryDate, setEntryDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedProductId || quantity === "" || !entryDate) return;
    setLoading(true);

    const dateStr = entryDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Envia para a função do pai (atualiza quantidade)
    onAdd(selectedProductId, Number(quantity), dateStr);

    // salva movimentação no IndexedDB
    const prod = products.find((p) => p.id === selectedProductId);
    try {
      await saveMovement({
        productId: selectedProductId,
        productName: prod?.name ?? String(selectedProductId),
        quantity: Number(quantity),
        type: "add",
        date: dateStr,
      });
    } catch (err) {
      console.error("Erro ao salvar movimentação:", err);
    } finally {
      setLoading(false);
      // reset campos
      setSearch("");
      setSelectedProductId(products[0]?.id ?? null);
      setQuantity("");
      setEntryDate(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Adicionar Produto</h2>

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
            placeholder="Quantidade"
            value={quantity === "" ? "" : String(quantity)}
            onChange={(e) =>
              setQuantity(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="cursor-text px-3 py-2 border rounded w-full"
          />

          <DatePicker
            selected={entryDate}
            onChange={(date: Date | null) => setEntryDate(date)}
            className="cursor-pointer px-3 py-2 border rounded w-full"
            placeholderText="Escolha a data de entrada"
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
            onClick={handleAdd}
            disabled={loading}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-lime-900 text-white rounded hover:bg-green-700 transition"
          >
            {loading ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
};
