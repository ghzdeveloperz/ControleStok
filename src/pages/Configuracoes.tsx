// src/pages/Configuracoes.tsx

import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaPlus } from "react-icons/fa";
import {
  onCategoriesUpdate,
  saveCategory,
  deleteCategory as deleteCategoryFromFirestore,
  categoryHasProducts
} from "../firebase/firestore/products";

interface ConfiguracoesProps {
  onLogoChange?: (newLogo: string) => void;
  onProfileChange?: (newProfile: string) => void;
  onLogout?: () => void;
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  onLogoChange,
  onProfileChange,
  onLogout,
}) => {

  const [logoSrc, setLogoSrc] = useState<string>("/images/jinjin-banner.png");
  const [profileSrc, setProfileSrc] = useState<string>("/images/profile-200.jpg");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 🔥 Categorias
  const [categories, setCategories] = useState<string[]>([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [errorDeleteMessage, setErrorDeleteMessage] = useState("");

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);

  // -----------------------------------------------------
  // 🔥 CARREGAR CATEGORIAS EM TEMPO REAL
  // -----------------------------------------------------
  useEffect(() => {
    const unsub = onCategoriesUpdate((cats) => setCategories(cats));
    return () => unsub();
  }, []);

  useEffect(() => {
    const savedLogo = localStorage.getItem("appLogo");
    const savedProfile = localStorage.getItem("profileImage");

    if (savedLogo) setLogoSrc(savedLogo);
    if (savedProfile) setProfileSrc(savedProfile);
  }, []);

  // -----------------------------------------------------
  // UPLOAD BANNER
  // -----------------------------------------------------
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      if (img.width !== 1224 || img.height !== 260) {
        alert("O banner deve ter exatamente 1224x260 px");
        logoInputRef.current!.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setLogoSrc(result);
        localStorage.setItem("appLogo", result);
        onLogoChange?.(result);
        logoInputRef.current!.value = "";
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

  // -----------------------------------------------------
  // UPLOAD PROFILE
  // -----------------------------------------------------
  const handleUploadProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      if (img.width !== 200 || img.height !== 200) {
        alert("A imagem deve ter exatamente 200x200 px");
        profileInputRef.current!.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setProfileSrc(result);
        localStorage.setItem("profileImage", result);
        onProfileChange?.(result);
        profileInputRef.current!.value = "";
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

  // -----------------------------------------------------
  // 🔥 ADICIONAR CATEGORIA
  // -----------------------------------------------------
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    await saveCategory(newCategory.trim());
    setNewCategory("");
  };

  // -----------------------------------------------------
  // 🔥 REMOVER CATEGORIA — 100% FUNCIONAL
  // -----------------------------------------------------
  const tryDeleteCategory = async (name: string) => {
    setErrorDeleteMessage("");

    const hasProducts = await categoryHasProducts(name);
    if (hasProducts) {
      setErrorDeleteMessage(
        "Esta categoria não pode ser excluída porque há produtos usando ela."
      );
      return;
    }

    setConfirmDeleteCategory(name);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteCategory) return;

    await deleteCategoryFromFirestore(confirmDeleteCategory);
    setConfirmDeleteCategory(null);
  };

  // -----------------------------------------------------
  // JSX
  // -----------------------------------------------------
  return (
    <div className="flex flex-col h-full justify-between p-6 gap-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>

        {/* PROFILE */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center gap-6 border border-gray-200">
          {!profileSrc || profileSrc === "/images/profile-200.jpg" ? (
            <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-lime-500 bg-gray-50 hover:bg-gray-100 transition-all">
              <FaPlus className="text-gray-400 text-3xl mb-1" />
              <span className="text-gray-500 text-sm font-semibold">
                Upload Profile
              </span>
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
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              <FaTrash />
              Remover
            </button>
          )}

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-gray-700 font-semibold mb-2 text-sm">
              Perfil Atual:
            </span>
            <div className="border rounded-full overflow-hidden w-28 h-28 shadow-inner">
              <img src={profileSrc} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <p className="text-gray-500 text-xs mt-2">
              A imagem deve ter 200x200 px
            </p>
          </div>
        </div>

        {/* BANNER */}
        <div className="bg-white rounded-xl shadow-md p-6 flex flex-col sm:flex-row items-center gap-6 border border-gray-200">
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
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg shadow cursor-pointer"
            >
              <FaTrash /> Remover
            </button>
          )}

          <div>
            <span className="text-gray-700 font-semibold mb-2 text-sm">
              Banner Atual:
            </span>
            <div className="border rounded-lg overflow-hidden w-[320px] h-[70px] shadow-inner">
              <img src={logoSrc} alt="Banner" className="w-full h-full object-cover" />
            </div>
            <p className="text-gray-500 text-xs mt-2">
              O banner deve ter 1224x260 px
            </p>
          </div>
        </div>

        {/* CATEGORIAS - BOTÃO ALTERADO AQUI */}
        <button
          onClick={() => setShowCategoriesModal(true)}
          className="
            bg-[#1f1f1f] 
            text-white 
            py-3 px-6 
            rounded-xl 
            shadow-lg 
            hover:bg-black 
            active:scale-[0.97] 
            transition-all 
            cursor-pointer 
            font-semibold
          "
        >
          Gerenciar Categorias
        </button>
      </div>

      {/* LOGOUT */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setShowLogoutModal(true)}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg font-semibold cursor-pointer"
        >
          Sair da conta
        </button>
      </div>

      {/* 🔥 MODAL DE CATEGORIAS */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96 shadow-xl flex flex-col gap-4">

            <h2 className="text-xl font-semibold text-gray-800 text-center">
              Categorias
            </h2>

            {errorDeleteMessage && (
              <p className="text-red-600 text-center text-sm">
                {errorDeleteMessage}
              </p>
            )}

            <div className="flex gap-2">
              <input
                className="flex-1 border px-3 py-2 rounded-lg"
                placeholder="Nova categoria"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button
                onClick={addCategory}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-800"
              >
                Adicionar
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto mt-2">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2 border-b"
                >
                  <span>{cat}</span>
                  <button
                    onClick={() => tryDeleteCategory(cat)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowCategoriesModal(false)}
              className="mt-4 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* 🔥 MODAL CONFIRMAR EXCLUSÃO */}
      {confirmDeleteCategory && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 w-72 flex flex-col gap-4 shadow-lg">

            <h2 className="text-lg font-semibold text-center">
              Excluir categoria?
            </h2>

            <p className="text-center text-gray-700">
              Tem certeza que deseja excluir <strong>{confirmDeleteCategory}</strong>?
            </p>

            <div className="flex gap-3 mt-3">
              <button
                className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                onClick={() => setConfirmDeleteCategory(null)}
              >
                Cancelar
              </button>

              <button
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 cursor-pointer"
                onClick={confirmDelete}
              >
                Excluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-xl p-6 w-80 flex flex-col gap-4 shadow-lg">
            <h2 className="text-lg font-semibold text-center text-gray-800">
              Confirmar saída
            </h2>
            <p className="text-center text-gray-600">
              Você tem certeza que quer sair da conta?
            </p>

            <div className="flex justify-between gap-4 mt-4">
              <button
                className="flex-1 bg-gray-200 text-gray-900 py-2 rounded-lg hover:bg-gray-300 cursor-pointer"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>

              <button
                className="flex-1 bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  setShowLogoutModal(false);
                  onLogout?.();
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
