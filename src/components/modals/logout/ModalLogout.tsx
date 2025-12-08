// src/components/modals/ModalLogout.tsx
import React, { useEffect, useState } from "react";

interface ModalLogoutProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => void;
}

export const ModalLogout: React.FC<ModalLogoutProps> = ({ isOpen, onClose, onConfirmLogout }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const timeout = setTimeout(() => setVisible(false), 300); // espera animação
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fundo escurecido leve com fade */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? "opacity-30" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal com fade + scale */}
      <div
        className={`relative bg-white rounded-xl shadow-lg p-6 w-80 text-center transition-all duration-300 transform ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h2 className="text-lg font-bold mb-4">Tem certeza que deseja sair?</h2>
        <div className="flex justify-between gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onClose();
              onConfirmLogout();
            }}
            className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
