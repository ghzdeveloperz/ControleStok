// src/components/modals/ModalAddProduct.tsx
import React, { useState } from "react";
import { Product } from "../ProductCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { saveMovement, saveProducts } from "../../db";

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
  const [selectedProductId, setSelectedProductId] = useState<Product["id"] | null>(
    products.length > 0 ? products[0].id : null
  );
  const [quantity, setQuantity] = useState<number | "">("");
  const [entryDate, setEntryDate] = useState<Date | null>(null);
  const [price, setPrice] = useState("");
  const [keepSamePrice, setKeepSamePrice] = useState(true);
  const [loading, setLoading] = useState(false);

  // Popup de confirmação
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Formatar moeda
  const formatCurrency = (value: string) => {
    const clean = value.replace(/\D/g, "");
    const number = Number(clean) / 100;
    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const parseCurrency = (formatted: string) => {
    return Number(formatted.replace(/\D/g, "")) / 100;
  };

  // === Quando desmarcar o checkbox, exibir popup ===
  const handleTogglePrice = () => {
    if (keepSamePrice) {
      // vai desmarcar: confirmar antes
      setShowPriceConfirm(true);
    } else {
      // vai marcar novamente
      setKeepSamePrice(true);
      setPrice("");
    }
  };

  // Confirma alteração de preço
  const confirmPriceChange = () => {
    setKeepSamePrice(false);
    setShowPriceConfirm(false);

    // Preencher automaticamente com o preço atual
    if (selectedProduct?.unitPrice) {
      setPrice(
        selectedProduct.unitPrice.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      );
    }
  };

  // Cancela alteração de preço
  const cancelPriceChange = () => {
    setKeepSamePrice(true);
    setShowPriceConfirm(false);
  };

  const handleAdd = async () => {
    if (!selectedProductId || quantity === "" || !entryDate) return;

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const qty = Number(quantity);

    const loteCost = keepSamePrice
      ? prod.unitPrice ?? prod.price
      : parseCurrency(price);

    if (!keepSamePrice && price === "") return;

    setLoading(true);
    const dateStr = entryDate.toISOString().split("T")[0];

    // Custo médio
    const oldQty = prod.quantity;
    const oldCost = prod.price;
    const newAvgCost = (oldQty * oldCost + qty * loteCost) / (oldQty + qty);

    prod.unitPrice = loteCost;

    onAdd(selectedProductId, qty, dateStr, newAvgCost, loteCost);

    try {
      await saveMovement({
        productId: selectedProductId,
        productName: prod.name,
        quantity: qty,
        price: loteCost,
        cost: newAvgCost,
        type: "add",
        date: dateStr,
      });

      // Atualizar banco
      await saveProducts(
        products.map((p) => ({
          id: p.id,
          quantity: p.quantity,
          cost: p.price,
          unitPrice: p.unitPrice ?? p.price,
        }))
      );
    } catch (err) {
      console.error("Erro ao salvar movimentação:", err);
    } finally {
      setLoading(false);
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
                {p.name} (Estoque: {p.quantity})
              </option>
            ))}
          </select>

          {/* Preço Atual exibido */}
          {selectedProduct && (
            <p className="text-sm text-gray-600">
              Preço atual:{" "}
              <span className="font-semibold">
                {selectedProduct.unitPrice?.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }) ?? "R$ 0,00"}
              </span>
            </p>
          )}

          <input
            type="number"
            placeholder="Quantidade"
            value={quantity === "" ? "" : String(quantity)}
            onChange={(e) =>
              setQuantity(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="cursor-text px-3 py-2 border rounded w-full"
            min={1}
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={keepSamePrice}
              onChange={handleTogglePrice}
            />
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
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            className="cursor-pointer px-4 py-2 bg-lime-900 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Adicionando..." : "Adicionar"}
          </button>
        </div>
      </div>

      {/* POPUP DE CONFIRMAÇÃO */}
      {showPriceConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-xl w-80 flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-gray-800 text-center">
              Alterar preço do produto?
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Esta ação permitirá definir um novo valor unitário.
            </p>

            <div className="flex gap-3 mt-3">
              <button
                className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                onClick={cancelPriceChange}
              >
                Cancelar
              </button>

              <button
                className="flex-1 bg-lime-700 text-white py-2 rounded-lg hover:bg-lime-800 cursor-pointer"
                onClick={confirmPriceChange}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
