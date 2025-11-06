// src/pages/Configuracoes.tsx
import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaPlus } from "react-icons/fa";

interface ConfiguracoesProps {
  onLogoChange?: (newLogo: string) => void;
  onProfileChange?: (newProfile: string) => void;
  onLogout?: () => void; // <-- adiciona aqui
}


export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  onLogoChange,
  onProfileChange,
  onLogout,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>("/images/sua-logo.png");
  const [profileSrc, setProfileSrc] = useState<string>("/images/profile-200.jpg");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem("appLogo");
    const savedProfile = localStorage.getItem("profileImage");
    if (savedLogo) setLogoSrc(savedLogo);
    if (savedProfile) setProfileSrc(savedProfile);
  }, []);

  // --- Funções de upload/remover Logo e Profile ---
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
    <div className="flex flex-col h-full justify-between p-6 gap-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>

        {/* Card Profile */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center gap-6 border border-gray-200 transition-all hover:shadow-lg">
          {!profileSrc || profileSrc === "/images/profile-200.jpg" ? (
            <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-lime-500 transition-all duration-300 bg-gray-50 hover:bg-gray-100">
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
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow transition-all duration-200"
            >
              <FaTrash />
              Remover
            </button>
          )}

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-gray-700 font-semibold mb-2 text-sm">Perfil Atual:</span>
            <div className="border rounded-full overflow-hidden w-28 h-28 shadow-inner">
              <img src={profileSrc} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <p className="text-gray-500 text-xs mt-2">A imagem deve ter 200x200 px</p>
          </div>
        </div>

        {/* Card Banner */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center gap-6 border border-gray-200 transition-all hover:shadow-lg">
          {!logoSrc || logoSrc === "/images/sua-logo.png" ? (
            <label className="flex flex-col items-center justify-center w-56 h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-lime-500 transition-all duration-300 bg-gray-50 hover:bg-gray-100">
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
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow transition-all duration-200"
            >
              <FaTrash />
              Remover
            </button>
          )}

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-gray-700 font-semibold mb-2 text-sm">Banner Atual:</span>
            <div className="border rounded-lg overflow-hidden w-[320px] h-[70px] shadow-inner">
              <img src={logoSrc} alt="Banner" className="w-full h-full object-cover" />
            </div>
            <p className="text-gray-500 text-xs mt-2">O banner deve ter exatamente 1224x260 px</p>
          </div>
        </div>
      </div>

      {/* Botão de Logout no rodapé */}
      <div className="sticky bottom-0 flex justify-center mt-6 pt-4 bg-gray-50">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all duration-200"
        >
          Sair da conta
        </button>
      </div>

      {/* Modal de Confirmação */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 w-80 flex flex-col gap-4 shadow-lg">
            <h2 className="text-lg font-semibold text-center text-gray-800">Confirmar saída</h2>
            <p className="text-center text-gray-600">Você tem certeza que quer sair da conta?</p>
            <div className="flex justify-between gap-4 mt-4">
              <button
                className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout?.(); // Volta para tela de login
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
