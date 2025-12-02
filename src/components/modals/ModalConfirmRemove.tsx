// src/components/modals/ModalConfirmRemove.tsx
import React from "react";
import { Product } from "../ProductCard";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onConfirmRemove: (productId: Product["id"], removeEntire?: boolean) => void;
}

export const ModalConfirmRemove: React.FC<Props> = ({
  isOpen,
  onClose,
  product,
  onConfirmRemove,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    // Passa removeEntire=true para excluir todo o produto
    onConfirmRemove(product.id, true);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-sm shadow-lg relative">
        <h2 className="text-xl font-bold mb-4">Remover Produto</h2>
        <p className="mb-4">
          Tem certeza que deseja remover <strong>{product.name}</strong> do estoque?
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded cursor-pointer hover:bg-gray-400 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700 transition"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
};
