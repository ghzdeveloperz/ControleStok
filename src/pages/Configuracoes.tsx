"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaPlus, FaUser, FaTags, FaSignOutAlt } from "react-icons/fa";
import { onCategoriesUpdateForUser } from "../firebase/firestore/categories";
import { ModalManageCategories } from "../components/modals/categories/ModalManageCategories";
import { ModalLogout } from "../components/modals/logout/ModalLogout";
import {
  sanitizeImageSource,
  validateAndReadImage,
} from "../utils/imageValidation";
import { getWorkspaceAssetKey } from "../utils/workspaceStorage";

interface ConfiguracoesProps {
  onLogoChange?: (newLogo: string) => void;
  onProfileChange?: (newProfile: string) => void;
  onLogout?: () => Promise<void>;
  userId: string;
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  onLogoChange,
  onProfileChange,
  onLogout,
  userId,
}) => {
  const logoStorageKey = getWorkspaceAssetKey(userId, "appLogo");
  const profileStorageKey = getWorkspaceAssetKey(userId, "profileImage");
  const [logoSrc, setLogoSrc] = useState<string>(() =>
    sanitizeImageSource(
      localStorage.getItem(logoStorageKey),
      "/images/jinjin-banner.png",
    ),
  );
  const [profileSrc, setProfileSrc] = useState<string>(() =>
    sanitizeImageSource(
      localStorage.getItem(profileStorageKey),
      "/images/profile-200.jpg",
    ),
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [activeSection, setActiveSection] = useState<"perfil" | "categoria">("perfil");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  // Carregar categorias do Firebase somente quando userId existir
  useEffect(() => {
    if (!userId) return;

    const unsub = onCategoriesUpdateForUser(userId, (cats: string[]) => setCategories(cats));
    return () => unsub();
  }, [userId]);

  // Upload de banner
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await validateAndReadImage(file, {
        maxBytes: 500 * 1024,
        exactWidth: 1224,
        exactHeight: 260,
      });
      localStorage.setItem(logoStorageKey, result);
      setLogoSrc(result);
      onLogoChange?.(result);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Banner inválido.");
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const removeLogo = () => {
    setLogoSrc("/images/jinjin-banner.png");
    localStorage.removeItem(logoStorageKey);
    onLogoChange?.("/images/jinjin-banner.png");
  };

  // Upload de perfil
  const handleUploadProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await validateAndReadImage(file, {
        maxBytes: 300 * 1024,
        exactWidth: 200,
        exactHeight: 200,
      });
      localStorage.setItem(profileStorageKey, result);
      setProfileSrc(result);
      onProfileChange?.(result);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Imagem de perfil inválida.");
    } finally {
      if (profileInputRef.current) profileInputRef.current.value = "";
    }
  };

  const removeProfile = () => {
    setProfileSrc("/images/profile-200.jpg");
    localStorage.removeItem(profileStorageKey);
    onProfileChange?.("/images/profile-200.jpg");
  };

  const handleLogout = async () => {
    if (!onLogout || loggingOut) return;

    setLoggingOut(true);
    try {
      await onLogout();
      setShowLogoutConfirm(false);
      setActiveSection("perfil");
    } catch {
      alert("Não foi possível encerrar a sessão. Tente novamente.");
    } finally {
      setLoggingOut(false);
    }
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
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void handleUploadProfile(event)}
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
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void handleUploadLogo(event)}
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
        userId={userId}

      />

      {/* MODAL DE LOGOUT */}
      <ModalLogout
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirmLogout={handleLogout}
        isLoading={loggingOut}
      />
    </div>
  );
};
