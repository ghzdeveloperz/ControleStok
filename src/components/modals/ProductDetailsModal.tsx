import React, { useState } from "react";
import { Product } from "../ProductCard";
import { FaTrash } from "react-icons/fa";
import { ModalConfirmRemove } from "./ModalConfirmRemove";

interface Props {
  product: Product;
  onClose: () => void;
  onRemove: (productId: Product["id"], removeEntire?: boolean) => Promise<void>;
}

export const ProductDetailsModal: React.FC<Props> = ({ product, onClose, onRemove }) => {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const safePrice = Number(product.price);
  const safeUnitPrice = Number(product.unitPrice);
  const safeQuantity = Number(product.quantity);
  const safeName = product.name ?? "Sem nome";
  const safeCategory = product.category ?? "-";
  const safeImage = product.image ?? "https://via.placeholder.com/400x300?text=Sem+Imagem";
  const safeMinStock = Number(product.minStock ?? 0);

  const totalCost = safePrice * safeQuantity;

  const handleConfirmRemove = async () => {
    await onRemove(product.id, true);
    setShowConfirmRemove(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
          <button
            onClick={() => setShowConfirmRemove(true)}
            className="absolute top-4 right-4 text-red-600 hover:text-red-800 transition cursor-pointer"
            title="Remover produto"
          >
            <FaTrash size={20} />
          </button>

          <h2 className="text-xl font-bold mb-4">Informações do Produto</h2>

          <div className="flex flex-col gap-3">
            <img src={safeImage} alt={safeName} className="w-full h-40 object-cover rounded" />
            <p className="text-lg font-semibold">{safeName}</p>

            <div className="flex flex-col gap-1">
              <p className="text-sm"><strong>Categoria:</strong> {safeCategory}</p>
              <p className="text-sm"><strong>Preço unitário:</strong> {formatCurrency(safeUnitPrice)}</p>
              <p className="text-sm"><strong>Custo médio:</strong> {formatCurrency(safePrice)}</p>
              <p className="text-sm"><strong>Quantidade em estoque:</strong> {safeQuantity}</p>
              <p className="text-sm"><strong>Estoque mínimo:</strong> {safeMinStock}</p>
              <hr />
              <p className="text-sm font-semibold text-gray-800">
                Custo total em estoque: <span className="text-black">{formatCurrency(totalCost)}</span>
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

      {showConfirmRemove && (
        <ModalConfirmRemove
          isOpen={showConfirmRemove}
          onClose={() => setShowConfirmRemove(false)}
          product={product}
          onConfirmRemove={handleConfirmRemove}
        />
      )}
    </>
  );
};
