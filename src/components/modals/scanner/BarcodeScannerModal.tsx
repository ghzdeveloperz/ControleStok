import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { BoltIcon } from "@heroicons/react/24/solid";

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
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    const stopScanner = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        videoTrackRef.current = null;
      }
    };

    const startScanner = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: { facingMode: { ideal: "environment" }, width: { ideal: 3840 }, height: { ideal: 2160 } },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const [videoTrack] = stream.getVideoTracks();
        videoTrackRef.current = videoTrack;

        const capabilities = videoTrack.getCapabilities() as any;

        if (capabilities.torch) setTorchSupported(true);

        if (capabilities.focusMode) {
          const focusModes: string[] = capabilities.focusMode;
          const mode =
            focusModes.includes("continuous")
              ? "continuous"
              : focusModes.includes("single-shot")
              ? "single-shot"
              : focusModes[0];
          await videoTrack.applyConstraints({ advanced: [{ focusMode: mode } as any] });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const intervalId = setInterval(async () => {
          if (!isOpen || !videoRef.current) return;
          try {
            const result = await reader.decodeFromVideoElement(videoRef.current);
            if (result) {
              onDetected(result.getText());
              clearInterval(intervalId);
              stopScanner();
            }
          } catch (err) {
            if (!(err instanceof NotFoundException)) console.error("Erro na leitura:", err);
          }
        }, 100);
      } catch (err) {
        console.error("Erro ao acessar câmera:", err);
      }
    };

    startScanner();
    return () => stopScanner();
  }, [isOpen, onDetected]);

  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;
    try {
      await videoTrackRef.current.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Erro ao alternar torch:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1050 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-5 w-[95%] max-w-md shadow-xl border border-neutral-200 dark:border-neutral-700">

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl transition-all text-2xl font-bold"
        >
          ×
        </button>

        {/* Botão Flash */}
        {torchSupported && (
          <button
            onClick={toggleTorch}
            className={`absolute -top-4 -left-4 w-10 h-10 flex items-center justify-center rounded-full ${
              torchOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-gray-700 hover:bg-gray-800"
            } text-white shadow-xl transition-all`}
          >
            <BoltIcon className="w-6 h-6" />
          </button>
        )}

        <h2 className="text-xl font-semibold text-center mb-4">Escanear Código de Barras</h2>

        <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
