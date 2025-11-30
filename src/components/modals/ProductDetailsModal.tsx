// src/components/modals/ProductDetailsModal.tsx
import React from "react";
import { Product } from "../ProductCard";

interface Props {
  product: Product;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<Props> = ({ product, onClose }) => {
  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totalCost = product.price * product.quantity; // custo médio * quantidade
  const unitPriceDisplay = product.unitPrice !== undefined ? product.unitPrice : product.price;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Informações do Produto</h2>

        <div className="flex flex-col gap-3">
          <img
            src={product.image ?? "https://via.placeholder.com/400x300?text=Sem+Imagem"}
            alt={product.name}
            className="w-full h-40 object-cover rounded"
          />

          <p className="text-lg font-semibold">{product.name}</p>

          <div className="flex flex-col gap-1">
            <p className="text-sm">
              <strong>Categoria:</strong> {product.category ?? "-"}
            </p>

            {/* Preço unitário definido pelo usuário */}
            <p className="text-sm">
              <strong>Preço unitário:</strong> {formatCurrency(unitPriceDisplay)}
            </p>

            {/* Preço médio */}
            <p className="text-sm">
              <strong>Custo médio:</strong> {formatCurrency(product.price)}
            </p>

            <p className="text-sm">
              <strong>Quantidade em estoque:</strong> {product.quantity}
            </p>

            <hr />

            <p className="text-sm font-semibold text-gray-800">
              Custo total em estoque:{" "}
              <span className="text-black">{formatCurrency(totalCost)}</span>
            </p>

            <p className="text-sm text-gray-600 italic">
              * O custo médio já é recalculado automaticamente a cada entrada.
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
