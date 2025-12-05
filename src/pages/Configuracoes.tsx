"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaPlus, FaUser, FaTags, FaSignOutAlt } from "react-icons/fa";
import { onCategoriesUpdateForUser } from "../firebase/firestore/categories";
import { ModalManageCategories } from "../components/modals/ModalManageCategories";
import { useNavigate } from "react-router-dom";
import { ModalLogout } from "../components/modals/ModalLogout";

interface ConfiguracoesProps {
  onLogoChange?: (newLogo: string) => void;
  onProfileChange?: (newProfile: string) => void;
  onLogout?: () => void;
  userId?: string; // sem fallback
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  onLogoChange,
  onProfileChange,
  onLogout,
  userId,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>("/images/jinjin-banner.png");
  const [profileSrc, setProfileSrc] = useState<string>("/images/profile-200.jpg");
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [activeSection, setActiveSection] = useState<"perfil" | "categoria">("perfil");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();

  // Carregar categorias do Firebase somente quando userId existir
  useEffect(() => {
    if (!userId) return;

    const unsub = onCategoriesUpdateForUser(userId, (cats: string[]) => setCategories(cats));
    return () => unsub();
  }, [userId]);

  // Carregar imagens do localStorage
  useEffect(() => {
    const savedLogo = localStorage.getItem("appLogo");
    const savedProfile = localStorage.getItem("profileImage");

    if (savedLogo) setLogoSrc(savedLogo);
    if (savedProfile) setProfileSrc(savedProfile);
  }, []);

  // Upload de banner
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
    setLogoSrc("/images/jinjin-banner.png");
    localStorage.removeItem("appLogo");
    onLogoChange?.("/images/jinjin-banner.png");
  };

  // Upload de perfil
  const handleUploadProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      if (img.width !== 200 || img.height !== 200) {
        alert("A imagem deve ter exatamente 200x200 px");
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
  };

  // Logout com redirecionamento
  const handleLogout = () => {
    onLogout?.();
    setActiveSection("perfil");
    navigate("/estoque");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-6 min-h-screen bg-gray-50">

      {/* MENU LATERAL */}
      <div className="flex flex-row sm:flex-col gap-3 mb-4 sm:mb-0">
        <button
          onClick={() => setActiveSection("perfil")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow font-semibold transition cursor-pointer ${
            activeSection === "perfil" ? "bg-gray-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100"
          }`}
        >
          <FaUser /> Perfil
        </button>

        <button
          onClick={() => setActiveSection("categoria")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow font-semibold transition cursor-pointer ${
            activeSection === "categoria" ? "bg-gray-900 text-white" : "bg-white text-gray-800 hover:bg-gray-100"
          }`}
        >
          <FaTags /> Categorias
        </button>

        {onLogout && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 mt-4 rounded-xl shadow font-semibold transition bg-red-600 text-white hover:bg-red-700 cursor-pointer"
          >
            <FaSignOutAlt /> Sair
          </button>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col gap-6">
        {activeSection === "perfil" && (
          <>
            <h1 className="text-3xl font-bold text-gray-800">Perfil</h1>

            {/* PROFILE */}
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-gray-200 w-full max-w-xl mx-auto">
              {!profileSrc || profileSrc === "/images/profile-200.jpg" ? (
                <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-lime-500 bg-gray-50 hover:bg-gray-100 transition-all">
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

              {profileSrc !== "/images/profile-200.jpg" && (
                <button
                  onClick={removeProfile}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow cursor-pointer sm:self-start"
                >
                  <FaTrash /> Remover
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

            {/* BANNER */}
            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-gray-200 w-full max-w-xl mx-auto">
              {!logoSrc || logoSrc === "/images/jinjin-banner.png" ? (
                <label className="flex flex-col items-center justify-center w-56 h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-lime-500 bg-gray-50 hover:bg-gray-100 transition-all">
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

              {logoSrc !== "/images/jinjin-banner.png" && (
                <button
                  onClick={removeLogo}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow cursor-pointer sm:self-start"
                >
                  <FaTrash /> Remover
                </button>
              )}

              <div className="flex flex-col items-center sm:items-start">
                <span className="text-gray-700 font-semibold mb-2 text-sm">Banner Atual:</span>
                <div className="border rounded-lg overflow-hidden w-[320px] h-[70px] shadow-inner">
                  <img src={logoSrc} alt="Banner" className="w-full h-full object-cover" />
                </div>
                <p className="text-gray-500 text-xs mt-2">O banner deve ter 1224x260 px</p>
              </div>
            </div>
          </>
        )}

        {activeSection === "categoria" && (
          <>
            <h1 className="text-3xl font-bold text-gray-800">Categorias</h1>
            <button
              onClick={() => setShowCategoriesModal(true)}
              className="bg-[#1f1f1f] text-white py-3 px-6 rounded-xl shadow-lg hover:bg-black active:scale-[0.97] transition-all cursor-pointer font-semibold mx-auto sm:mx-0"
            >
              Gerenciar Categorias
            </button>
          </>
        )}
      </div>

      {/* MODAL DE CATEGORIAS */}
      <ModalManageCategories
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        categories={categories}
        setCategories={setCategories}
        userId={userId ?? "defaultUserId"}

      />

      {/* MODAL DE LOGOUT */}
      <ModalLogout
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirmLogout={handleLogout}
      />
    </div>
  );
};
