import React, { useState, useEffect, useRef } from "react";
import { XMarkIcon, BoltIcon } from "@heroicons/react/24/solid";
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
  const [torchOn, setTorchOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const toggleTorch = () => {
    if (!videoRef.current) return;
    const track = (videoRef.current.srcObject as MediaStream)?.getVideoTracks()[0];
    if (!track) return;

    try {
      track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Erro ao alternar torch:", err);
    }
  };

  // pega o vídeo interno do BarcodeScannerComponent assim que ele montar
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      const videoEl = document.querySelector<HTMLVideoElement>("video");
      if (videoEl) {
        videoRef.current = videoEl;
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-1050 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative bg-linear-to-br from-neutral-900 to-neutral-800 rounded-3xl shadow-2xl p-6 w-[90%] max-w-md flex flex-col items-center border border-neutral-700 h-[550px]">

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 transition-all text-white shadow-lg hover:scale-105"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Botão Flash */}
        <button
          onClick={toggleTorch}
          className={`absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-full ${
            torchOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-700 hover:bg-gray-800"
          } text-white shadow-lg transition-all hover:scale-105`}
        >
          <BoltIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Escanear Código</h2>
        <div className="w-16 h-1 bg-red-500 rounded-full mb-6" />

        <div className="w-[300px] h-[400px] bg-black rounded-xl overflow-hidden shadow-xl ring-2 ring-red-500 ring-offset-4">
          {!cameraError ? (
            <BarcodeScannerComponent
              width={300}
              height={400}
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
            <div className="w-full h-full flex flex-col items-center justify-center text-red-400 p-4 text-center font-medium">
              <p>Erro ao acessar a câmera.</p>
              <p className="text-sm mt-1">Verifique permissões e tente novamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
