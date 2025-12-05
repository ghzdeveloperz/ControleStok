// src/components/modals/ModalManageCategories.tsx

import React, { useState, useEffect } from "react";
import { FaTrash } from "react-icons/fa";

import {
  saveCategoryForUser,
  deleteCategoryForUser,
  onCategoriesUpdateForUser,
} from "../../firebase/firestore/categories";

import {
  ProductQuantity,
  getProductsForUser,
} from "../../firebase/firestore/products";

interface ModalManageCategoriesProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  userId: string;
}

export const ModalManageCategories: React.FC<ModalManageCategoriesProps> = ({
  isOpen,
  onClose,
  categories,
  setCategories,
  userId,
}) => {
  const [newCategory, setNewCategory] = useState("");
  const [errorDeleteMessage, setErrorDeleteMessage] = useState<string | null>(
    null
  );
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<
    string | null
  >(null);

  // ----------------------------
  // 🔥 REALTIME FIRESTORE LISTENER
  // ----------------------------
  useEffect(() => {
    if (!userId) return;

    const unsub = onCategoriesUpdateForUser(userId, (list) => {
      setCategories(list);
    });

    return () => unsub();
  }, [userId, setCategories]);

  // ----------------------------
  // ADICIONAR
  // ----------------------------
  const addCategory = async () => {
    if (!newCategory.trim()) return;

    if (
      categories.some(
        (cat) =>
          cat.toLowerCase() === newCategory.trim().toLowerCase()
      )
    ) {
      setErrorDeleteMessage(`A categoria "${newCategory}" já existe!`);
      return;
    }

    await saveCategoryForUser(userId, newCategory.trim());
    setNewCategory("");
    setErrorDeleteMessage(null);
  };

  // ----------------------------
  // VERIFICAR SE TEM PRODUTOS
  // ----------------------------
  const categoryHasProducts = async (categoryName: string) => {
    const products: ProductQuantity[] = await getProductsForUser(userId);

    return products.some(
      (p) =>
        p.category?.toLowerCase() === categoryName.toLowerCase()
    );
  };

  // ----------------------------
  // TENTAR EXCLUIR
  // ----------------------------
  const tryDeleteCategory = async (name: string) => {
    setErrorDeleteMessage(null);

    const hasProducts = await categoryHasProducts(name);
    if (hasProducts) {
      setErrorDeleteMessage(
        "Esta categoria não pode ser excluída porque há produtos usando ela."
      );
      return;
    }

    setConfirmDeleteCategory(name);
  };

  // ----------------------------
  // CONFIRMAR EXCLUSÃO
  // ----------------------------
  const confirmDelete = async () => {
    if (!confirmDeleteCategory) return;

    await deleteCategoryForUser(userId, confirmDeleteCategory);
    setConfirmDeleteCategory(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-800 text-center">
          Categorias
        </h2>

        {errorDeleteMessage && (
          <p className="text-red-600 text-center text-sm">
            {errorDeleteMessage}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 border px-3 py-2 rounded-lg w-full"
            placeholder="Nova categoria"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button
            onClick={addCategory}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800 w-full sm:w-auto"
          >
            Adicionar
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto mt-2">
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center justify-between p-2 border-b"
            >
              <span>{cat}</span>
              <button
                onClick={() => tryDeleteCategory(cat)}
                className="text-red-600 hover:text-red-800 cursor-pointer"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
        >
          Fechar
        </button>

        {confirmDeleteCategory && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-xs flex flex-col gap-4 shadow-lg">
              <h2 className="text-lg font-semibold text-center">
                Excluir categoria?
              </h2>
              <p className="text-center text-gray-700">
                Tem certeza que deseja excluir{" "}
                <strong>{confirmDeleteCategory}</strong>?
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <button
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                  onClick={() => setConfirmDeleteCategory(null)}
                >
                  Cancelar
                </button>

                <button
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 cursor-pointer"
                  onClick={confirmDelete}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
