// src/components/modals/ModalAddCategory.tsx
import React, { useState } from "react";

interface ModalAddCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: (name: string) => void;
  existingCategories: string[];
}

export const ModalAddCategory: React.FC<ModalAddCategoryProps> = ({
  isOpen,
  onClose,
  onAddCategory,
  existingCategories,
}) => {
  const [novaCategoria, setNovaCategoria] = useState("");
  const [alerta, setAlerta] = useState("");

  const handleAdd = () => {
    if (!novaCategoria.trim()) return;

    // Verifica duplicidade ignorando maiúsculas/minúsculas
    const existe = existingCategories.some(
      (cat) => cat.toLowerCase() === novaCategoria.trim().toLowerCase()
    );

    if (existe) {
      setAlerta(`A categoria "${novaCategoria}" já existe!`);
      return;
    }

    onAddCategory(novaCategoria.trim());
    setNovaCategoria("");
    setAlerta("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-80 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Criar nova categoria</h2>

        <input
          type="text"
          placeholder="Ex: Sobremesas"
          value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          className="w-full px-4 py-3 bg-gray-100 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black/10 outline-none"
        />

        {alerta && <p className="text-red-600 text-sm mt-2">{alerta}</p>}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              setNovaCategoria("");
              setAlerta("");
              onClose();
            }}
            className="flex-1 py-3 rounded-xl bg-gray-300 text-gray-700 hover:bg-gray-400 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-3 rounded-xl bg-lime-900 text-white hover:bg-lime-800 transition cursor-pointer"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};
