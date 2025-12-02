import React, { useState, useEffect } from "react";
import { Product } from "../ProductCard";
import { FaTrash, FaPen } from "react-icons/fa";
import { ModalConfirmRemove } from "./ModalConfirmRemove";
import { getCategories } from "../../firebase/firestore/products";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";


interface Props {
  product: Product;
  onClose: () => void;
  onRemove: (productId: Product["id"], removeEntire?: boolean) => Promise<void>;
}

export const ProductDetailsModal: React.FC<Props> = ({ product, onClose, onRemove }) => {
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [newCategory, setNewCategory] = useState(product.category);

  useEffect(() => {
    const load = async () => setCategories(await getCategories());
    load();
  }, []);

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

  const handleSaveCategory = async () => {
    if (!newCategory) return;

    const ref = doc(db, "quantities", product.id);
    await updateDoc(ref, { category: newCategory });

    setEditing(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">

          {/* BOTÃO REMOVER */}
          <button
            onClick={() => setShowConfirmRemove(true)}
            className="absolute top-4 right-4 text-red-600 hover:text-red-800 transition cursor-pointer"
            title="Remover produto"
          >
            <FaTrash size={20} />
          </button>

          <h2 className="text-xl font-bold mb-4">Informações do Produto</h2>

          <div className="flex flex-col gap-3">

            <img
              src={safeImage}
              alt={safeName}
              className="w-full h-40 object-cover rounded"
            />

            <p className="text-lg font-semibold">{safeName}</p>

            <div className="flex flex-col gap-1">

              {/* LINHA PARA EDITAR CATEGORIA */}
              <div className="flex items-center gap-2">

                <p className="text-sm">
                  <strong>Categoria:</strong> {editing ? "" : safeCategory}
                </p>

                {/* BOTÃO DE EDITAR */}
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="p-1 rounded-full hover:bg-gray-200 cursor-pointer"
                    title="Editar categoria"
                  >
                    <FaPen size={14} className="text-gray-700" />
                  </button>
                )}
              </div>

              {/* SELECT PARA ALTERAR A CATEGORIA */}
              {editing && (
                <div className="flex gap-2 items-center mt-1">

                  <select
                    className="border p-1 rounded"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* BOTÃO SALVAR */}
                  <button
                    onClick={handleSaveCategory}
                    className="px-2 py-1 bg-black text-white rounded text-sm cursor-pointer"
                  >
                    Salvar
                  </button>

                  {/* CANCELAR */}
                  <button
                    onClick={() => setEditing(false)}
                    className="px-2 py-1 bg-gray-300 rounded text-sm cursor-pointer"
                  >
                    X
                  </button>

                </div>
              )}

              <p className="text-sm"><strong>Preço unitário:</strong> {formatCurrency(safeUnitPrice)}</p>
              <p className="text-sm"><strong>Custo médio:</strong> {formatCurrency(safePrice)}</p>
              <p className="text-sm"><strong>Quantidade em estoque:</strong> {safeQuantity}</p>
              <p className="text-sm"><strong>Estoque mínimo:</strong> {safeMinStock}</p>

              <hr />

              <p className="text-sm font-semibold text-gray-800">
                Custo total em estoque:{" "}
                <span className="text-black">{formatCurrency(totalCost)}</span>
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
