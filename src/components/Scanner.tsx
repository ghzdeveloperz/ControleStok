import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface ScannerProps {
  onDetected: (code: string) => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onDetected }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "scanner",
      {
        fps: 10,
        qrbox: 250,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onDetected(decodedText);
      },
      (error) => {
        console.warn("Erro ao escanear:", error);
      }
    );

    return () => {
      scanner.clear().catch((error) => {
        console.error("Erro ao limpar scanner:", error);
      });
    };
  }, [onDetected]);

  return (
    <div className="w-full flex flex-col items-center">
      <div id="scanner" className="w-full max-w-md" />
    </div>
  );
};
