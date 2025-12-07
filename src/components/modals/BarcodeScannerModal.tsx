
// src/components/modals/BarcodeScannerModal.tsx

import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const startScanner = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const detectLoop = async () => {
          if (!isOpen || !videoRef.current) return;

          try {
            const result = await reader.decodeFromVideoElement(videoRef.current);

            if (result) {
              onDetected(result.getText());
              stopScanner();
              return;
            }
          } catch (err) {
            if (!(err instanceof NotFoundException)) {
              console.error("Erro na leitura:", err);
            }
          }

          requestAnimationFrame(detectLoop);
        };

        requestAnimationFrame(detectLoop);
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
      }
    };

    const stopScanner = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };

    startScanner();
    return () => stopScanner();
  }, [isOpen, onDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-5 w-[95%] max-w-md shadow-xl border border-neutral-200 dark:border-neutral-700">

        {/* botão fechar premium */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600
                   text-white flex items-center justify-center shadow-xl transition-all text-2xl font-bold"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-center mb-4">
          Escanear Código de Barras
        </h2>

        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
