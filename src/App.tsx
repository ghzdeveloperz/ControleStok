// src/App.tsx
import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Estoque } from "./pages/Estoque";

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<"Estoque" | "Relatórios" | "Configurações">("Estoque");

  const renderPage = () => {
    switch (activePage) {
      case "Estoque":
        return <Estoque />;
      case "Relatórios":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p>Em breve você poderá visualizar relatórios aqui...</p>
          </div>
        );
      case "Configurações":
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p>Gerencie as configurações do sistema aqui...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar active={activePage} onNavigate={setActivePage} />

      {/* Conteúdo principal */}
      <div className="flex-1 bg-gray-50 overflow-auto">{renderPage()}</div>
    </div>
  );
};
