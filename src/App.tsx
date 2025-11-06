// src/App.tsx
import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Estoque } from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import { Configuracoes } from "./pages/Configuracoes";
import { Auth, AuthUserData } from "./pages/Auth";
import { LoadingProvider, useLoading } from "./contexts/LoadingContext";

export const AppContent: React.FC = () => {
  const [user, setUser] = useState<AuthUserData | null>(null);
  const [activePage, setActivePage] = useState<"Estoque" | "Relatórios" | "Configurações">("Estoque");

  // Carrega logo e perfil com fallback
  const [logoSrc, setLogoSrc] = useState(localStorage.getItem("appLogo") ?? "/images/sua-logo.png");

  // Corrige cache ao carregar imagem salva — já aplica novo timestamp a cada render
  const storedProfile = localStorage.getItem("profileImage");
  const [profileSrc, setProfileSrc] = useState(
    storedProfile ? `${storedProfile}?t=${Date.now()}` : "/images/profile-200.jpg"
  );

  const [userID, setUserID] = useState("xxxxx");
  const { showLoading, hideLoading } = useLoading();

  // Função de logout
  const handleLogout = () => {
    setUser(null);
    setProfileSrc("/images/profile-200.jpg");
    setUserID("xxxxx");
  };

  // Se não está logado, exibe tela de login
  if (!user) {
    return (
      <Auth
        onLogin={(data) => {
          setUser(data);
          setUserID(data.email ?? "xxxxx");

          if (data.photoURL) {
            const newProfile = `${data.photoURL}?t=${Date.now()}`; // quebra cache
            setProfileSrc(newProfile);
            localStorage.setItem("profileImage", data.photoURL); // salva a URL original, SEM timestamp
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
              localStorage.setItem("profileImage", newProfile); // sempre salva **sem** timestamp
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
