import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Estoque } from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";


export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<"Estoque" | "Relatórios" | "Configurações">("Estoque");

  const renderPage = () => {
    switch (activePage) {
      case "Estoque":
        return <Estoque />;   
      case "Relatórios":
        return <Relatorios />;
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
      <Sidebar active={activePage} onNavigate={setActivePage} />
      <div className="flex-1 bg-gray-50 overflow-auto">{renderPage()}</div>
    </div>
  );
};
