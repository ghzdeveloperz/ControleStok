import React, { useState } from "react";
import { Product } from "../ProductCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface ModalAddProductProps {
  onClose: () => void;
  onAdd: (product: Product, entryDate: string) => void;
  nextId: number | string;
}

export const ModalAddProduct: React.FC<ModalAddProductProps> = ({
  onClose,
  onAdd,
  nextId,
}) => {
  const [name, setName] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState<
    "Brasileiros" | "Asiáticos" | "Limpeza" | "Sushi"
  >("Brasileiros");
  const [entryDate, setEntryDate] = useState<Date | null>(null);

  const handleAdd = () => {
    if (!name.trim() || quantity === "" || price === "" || !entryDate) return;

    const product: Product = {
      id: nextId,
      name: name.trim(),
      quantity: Number(quantity),
      price: Number(price),
      category,
      image: "/images/no-image.png", // placeholder
    };

    // envia a data como string ISO
    onAdd(product, entryDate.toISOString());

    // reset campos
    setName("");
    setQuantity("");
    setPrice("");
    setCategory("Brasileiros");
    setEntryDate(null);

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Adicionar Produto</h2>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome do produto"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="cursor-text px-3 py-2 border rounded w-full"
          />
          <input
            type="number"
            placeholder="Quantidade"
            value={quantity === "" ? "" : String(quantity)}
            onChange={(e) =>
              setQuantity(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="cursor-text px-3 py-2 border rounded w-full"
          />
          <input
            type="number"
            placeholder="Preço (R$)"
            value={price === "" ? "" : String(price)}
            onChange={(e) =>
              setPrice(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="cursor-text px-3 py-2 border rounded w-full"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="cursor-pointer px-3 py-2 border rounded w-full"
          >
            <option value="Brasileiros">Brasileiros</option>
            <option value="Asiáticos">Asiáticos</option>
            <option value="Limpeza">Limpeza</option>
            <option value="Sushi">Sushi</option>
            <option value="Frios">Frios</option> {/* nova categoria */}
          </select>


          {/* DatePicker */}
          <DatePicker
            selected={entryDate}
            onChange={(date: Date | null) => setEntryDate(date)}
            className="cursor-pointer px-3 py-2 border rounded w-full"
            placeholderText="Escolha a data de entrada"
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
            onClick={handleAdd}
            className="cursor-pointer px-2 py-1 text-xs sm:px-4 sm:py-2 sm:text-base bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};
