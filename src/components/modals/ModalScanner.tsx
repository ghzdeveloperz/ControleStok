import React, { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

interface ModalScannerProps {
  open: boolean;
  onClose: () => void;
  onResult: (code: string) => void;
}

export const ModalScanner: React.FC<ModalScannerProps> = ({
  open,
  onClose,
  onResult,
}) => {
  const [cameraError, setCameraError] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md flex flex-col items-center">

        {/* BOTÃO FECHAR — PREMIUM */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 transition text-white shadow-md"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Escanear Código</h2>

        <div className="w-[280px] h-[280px] bg-black rounded-xl overflow-hidden shadow-lg">
          {!cameraError ? (
            <BarcodeScannerComponent
              width={280}
              height={280}
              facingMode="environment"
              onUpdate={(err, result) => {
                if (result) {
                  const code = result.getText();
                  onResult(code);
                  onClose();
                }
              }}
              onError={(e) => {
                console.error("Camera error:", e);
                setCameraError(true);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white p-4 text-center">
              Erro ao acessar a câmera.
              Verifique permissões e tente novamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
