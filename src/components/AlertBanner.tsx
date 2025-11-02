// src/components/AlertBanner.tsx
import React, { useEffect, useState } from "react";

interface AlertBannerProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ message, type, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // ativa a animação quando o componente monta
    setShow(true);

    const timer = setTimeout(() => {
      setShow(false);
      // fecha de fato após animação
      setTimeout(onClose, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg
        ${type === "success" ? "bg-lime-900 text-white" : "bg-red-800 text-white"}
        transform transition-transform duration-300
        ${show ? "animate-elastic" : "scale-0"}
      `}
    >
      {message}
    </div>
  );
};
