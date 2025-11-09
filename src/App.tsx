// src/App.tsx
import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Estoque } from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import { Configuracoes } from "./pages/Configuracoes";
import { Auth, AuthUserData } from "./pages/Auth";
import { LoadingProvider } from "./contexts/LoadingContext";

export const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthUserData | null>(null);
  const [activePage, setActivePage] = useState<"Estoque" | "Relatórios" | "Configurações">("Estoque");

  // Logo principal
  const [logoSrc, setLogoSrc] = useState(
    localStorage.getItem("appLogo") ?? "/images/sua-logo.png"
  );

  // Imagem de perfil com quebra de cache
  const storedProfile = localStorage.getItem("profileImage");
  const [profileSrc, setProfileSrc] = useState(
    storedProfile ? `${storedProfile}?t=${Date.now()}` : "/images/profile-200.jpg"
  );

  const [userID, setUserID] = useState("xxxxx");

  const handleLogout = () => {
    setUser(null);
    setProfileSrc("/images/profile-200.jpg");
    setLogoSrc("/images/sua-logo.png");
    setUserID("xxxxx");

    // limpa localStorage
    localStorage.removeItem("profileImage");
    localStorage.removeItem("appLogo");
  };

  // Se não está logado, exibe tela de login
  if (!user) {
    return (
      <Auth
        onLogin={(data) => {
          setUser(data);
          setUserID(data.email ?? "xxxxx");

          if (data.photoURL) {
            const newProfile = `${data.photoURL}?t=${Date.now()}`;
            setProfileSrc(newProfile);
            localStorage.setItem("profileImage", data.photoURL);
          } else {
            setProfileSrc("/images/profile-200.jpg");
          }
        }}
      />
    );
  }

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
