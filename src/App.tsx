// App.tsx
import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Estoque } from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import { Configuracoes } from "./pages/Configuracoes";

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<"Estoque" | "Relatórios" | "Configurações">("Estoque");
  const [logoSrc, setLogoSrc] = useState<string>("/images/sua-logo.png");
  const [profileSrc, setProfileSrc] = useState<string>("/images/profile-200.jpg");

  // Ler logo e profile do localStorage ao montar
  useEffect(() => {
    const savedLogo = localStorage.getItem("appLogo");
    const savedProfile = localStorage.getItem("profileImage");
    if (savedLogo) setLogoSrc(savedLogo);
    if (savedProfile) setProfileSrc(savedProfile);
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar
        active={activePage}
        onNavigate={setActivePage}
        logoSrc={logoSrc}
        profileSrc={profileSrc}
      />
      <div className="flex-1 bg-gray-50 overflow-auto">
        {activePage === "Estoque" && <Estoque />}
        {activePage === "Relatórios" && <Relatorios />}
        {activePage === "Configurações" && (
          <Configuracoes
            onLogoChange={(newLogo) => setLogoSrc(newLogo)}
            onProfileChange={(newProfile) => setProfileSrc(newProfile)}
          />
        )}
      </div>
    </div>
  );
};
