// src/components/AlertBanner.tsx
import React, { useEffect } from "react";

interface AlertBannerProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  message,
  type,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`w-full text-white px-4 py-3 rounded-md mb-4 shadow-md transition-opacity duration-300
        ${type === "success" ? "bg-green-600" : "bg-red-600"}
      `}
    >
      <span className="font-medium">
        {type === "success" ? "✅" : "❌"} {message}
      </span>
    </div>
  );
};
