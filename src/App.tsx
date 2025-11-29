// src/App.tsx
import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Estoque } from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import { Configuracoes } from "./pages/Configuracoes";
import { LoadingProvider } from "./contexts/LoadingContext";

export const AppContent: React.FC = () => {
  const [activePage, setActivePage] = useState<
    "Estoque" | "Relatórios" | "Configurações"
  >("Estoque");

  // Logo principal
  const [logoSrc, setLogoSrc] = useState(
    localStorage.getItem("appLogo") ?? "/images/jinjin.png"
  );

  // Imagem de perfil com quebra de cache
  const storedProfile = localStorage.getItem("profileImage");
  const [profileSrc, setProfileSrc] = useState(
    storedProfile ? `${storedProfile}?t=${Date.now()}` : "/images/profile-200.jpg"
  );

  // Sem login → define um ID padrão
  const [userID] = useState("usuário");

  const handleLogout = () => {
    // Agora o "logout" só limpa imagens
    localStorage.removeItem("profileImage");
    localStorage.removeItem("appLogo");

    setLogoSrc("/images/jinjin.png");
    setProfileSrc("/images/profile-200.jpg");
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        active={activePage}
        onNavigate={setActivePage}
        logoSrc={logoSrc}
        profileSrc={profileSrc}
        userId={userID}
      />

      <div className="flex-1 bg-gray-50 overflow-auto">
        {activePage === "Estoque" && <Estoque />}
        {activePage === "Relatórios" && <Relatorios />}
        {activePage === "Configurações" && (
          <Configuracoes
            onLogoChange={(newLogo) => {
              setLogoSrc(newLogo);
              localStorage.setItem("appLogo", newLogo);
            }}
            onProfileChange={(newProfile) => {
              const updatedProfile = `${newProfile}?t=${Date.now()}`;
              setProfileSrc(updatedProfile);
              localStorage.setItem("profileImage", newProfile);
            }}
            onLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <LoadingProvider>
    <AppContent />
  </LoadingProvider>
);
  