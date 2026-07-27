import { useEffect, useRef, useState } from "react";
import { BoltIcon, XMarkIcon } from "@heroicons/react/24/solid";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

interface ModalScannerProps {
  open: boolean;
  onClose: () => void;
  onResult: (code: string) => void;
}

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraint = MediaTrackConstraintSet & { torch?: boolean };

export const ModalScanner = ({ open, onClose, onResult }: ModalScannerProps) => {
  const [cameraError, setCameraError] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) return;

    setCameraError(false);
    setTorchOn(false);
    setTorchSupported(false);
    const interval = window.setInterval(() => {
      const video = containerRef.current?.querySelector("video");
      if (!video) return;

      videoRef.current = video;
      const track = (video.srcObject as MediaStream | null)?.getVideoTracks()[0];
      const capabilities = track?.getCapabilities() as TorchCapabilities | undefined;
      setTorchSupported(capabilities?.torch === true);
      window.clearInterval(interval);
    }, 100);

    return () => {
      window.clearInterval(interval);
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      videoRef.current = null;
    };
  }, [open]);

  const toggleTorch = async () => {
    const track = (videoRef.current?.srcObject as MediaStream | null)?.getVideoTracks()[0];
    if (!track || !torchSupported) return;

    try {
      const nextValue = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextValue } as TorchConstraint],
      });
      setTorchOn(nextValue);
    } catch {
      setTorchSupported(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-1050 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative flex h-[550px] w-[90%] max-w-md flex-col items-center rounded-3xl border border-neutral-700 bg-linear-to-br from-neutral-900 to-neutral-800 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar leitor"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {torchSupported && (
          <button
            type="button"
            onClick={() => void toggleTorch()}
            aria-label={torchOn ? "Desligar lanterna" : "Ligar lanterna"}
            className={`absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full ${
              torchOn
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-gray-700 hover:bg-gray-800"
            } text-white shadow-lg transition-all hover:scale-105`}
          >
            <BoltIcon className="h-6 w-6" />
          </button>
        )}

        <h2 className="mb-2 text-2xl font-bold tracking-wide text-white">
          Escanear Código
        </h2>
        <div className="mb-6 h-1 w-16 rounded-full bg-red-500" />

        <div
          ref={containerRef}
          className="h-[400px] w-[300px] overflow-hidden rounded-xl bg-black shadow-xl ring-2 ring-red-500 ring-offset-4"
        >
          {!cameraError ? (
            <BarcodeScannerComponent
              width={300}
              height={400}
              facingMode="environment"
              onUpdate={(error, result) => {
                if (error || !result) return;
                const code = result.getText().trim();
                if (code) onResult(code);
              }}
              onError={() => setCameraError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center font-medium text-red-400">
              <p>Erro ao acessar a câmera.</p>
              <p className="mt-1 text-sm">Verifique as permissões e tente novamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
