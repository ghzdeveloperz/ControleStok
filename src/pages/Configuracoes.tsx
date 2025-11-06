// src/pages/Configuracoes.tsx
import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaPlus } from "react-icons/fa";

interface ConfiguracoesProps {
  onLogoChange?: (newLogo: string) => void; // atualiza o Sidebar
  onProfileChange?: (newProfile: string) => void; // atualiza a Sidebar/rodapé
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({ onLogoChange, onProfileChange }) => {
  const [logoSrc, setLogoSrc] = useState<string>("/images/sua-logo.png");
  const [profileSrc, setProfileSrc] = useState<string>("/images/profile-200.jpg");
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  // Carrega valores salvos
  useEffect(() => {
    const savedLogo = localStorage.getItem("appLogo");
    const savedProfile = localStorage.getItem("profileImage");
    if (savedLogo) setLogoSrc(savedLogo);
    if (savedProfile) setProfileSrc(savedProfile);
  }, []);

  // Upload Banner
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      if (img.width !== 1224 || img.height !== 260) {
        alert("O banner deve ter exatamente 1224x260 px");
        if (logoInputRef.current) logoInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoSrc(result);
        localStorage.setItem("appLogo", result);
        onLogoChange?.(result);
        if (logoInputRef.current) logoInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    };
    img.src = URL.createObjectURL(file);
  };

  const removeLogo = () => {
    setLogoSrc("/images/sua-logo.png");
    localStorage.removeItem("appLogo");
    onLogoChange?.("/images/sua-logo.png");
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  // Upload Profile
  const handleUploadProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      if (img.width !== 200 || img.height !== 200) {
        alert("A imagem de profile deve ter exatamente 200x200 px");
        if (profileInputRef.current) profileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setProfileSrc(result);
        localStorage.setItem("profileImage", result);
        onProfileChange?.(result);
        if (profileInputRef.current) profileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    };
    img.src = URL.createObjectURL(file);
  };

  const removeProfile = () => {
    setProfileSrc("/images/profile-200.jpg");
    localStorage.removeItem("profileImage");
    onProfileChange?.("/images/profile-200.jpg");
    if (profileInputRef.current) profileInputRef.current.value = "";
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* Container Profile */}
      <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-center gap-4 border border-gray-200">
        {!profileSrc || profileSrc === "/images/profile-200.jpg" ? (
          <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-lime-500 transition-all duration-300 bg-gray-50 hover:bg-gray-100">
            <FaPlus className="text-gray-400 text-3xl mb-1" />
            <span className="text-gray-500 text-sm font-semibold">Upload Profile</span>
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadProfile}
              className="hidden"
            />
          </label>
        ) : null}

        {profileSrc && profileSrc !== "/images/profile-200.jpg" && (
          <button
            onClick={removeProfile}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow cursor-pointer transition-all duration-200"
          >
            <FaTrash />
            Remover
          </button>
        )}

        <div className="flex flex-col">
          <span className="text-gray-700 font-semibold mb-1 text-sm">Perfil Atual:</span>
          <div className="border rounded-full overflow-hidden w-24 h-24 shadow-inner">
            <img src={profileSrc} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <p className="text-gray-500 text-xs mt-1">A imagem deve ter 200x200 px</p>
        </div>
      </div>

      {/* Container Banner */}
      <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-center gap-4 border border-gray-200">
        {!logoSrc || logoSrc === "/images/sua-logo.png" ? (
          <label className="flex flex-col items-center justify-center w-48 h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-lime-500 transition-all duration-300 bg-gray-50 hover:bg-gray-100">
            <FaPlus className="text-gray-400 text-3xl mb-1" />
            <span className="text-gray-500 text-sm font-semibold">Upload Banner</span>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadLogo}
              className="hidden"
            />
          </label>
        ) : null}

        {logoSrc && logoSrc !== "/images/sua-logo.png" && (
          <button
            onClick={removeLogo}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow cursor-pointer transition-all duration-200"
          >
            <FaTrash />
            Remover
          </button>
        )}

        <div className="flex flex-col">
          <span className="text-gray-700 font-semibold mb-1 text-sm">Banner Atual:</span>
          <div className="border rounded-lg overflow-hidden w-[306px] h-[65px] shadow-inner">
            <img src={logoSrc} alt="Banner" className="w-full h-full object-cover" />
          </div>
          <p className="text-gray-500 text-xs mt-1">O banner deve ter exatamente 1224x260 px</p>
        </div>
      </div>
    </div>
  );
};
