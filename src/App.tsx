import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { ProductCard } from "./components/ProductCard";

// Produtos de exemplo
const sampleProducts = [
  { id: 1, name: "Produto A", price: 49.9, quantity: 10, image: "https://via.placeholder.com/300x200" },
  { id: 2, name: "Produto B", price: 79.9, quantity: 0, image: "https://via.placeholder.com/300x200" },
  { id: 3, name: "Produto C", price: 19.9, quantity: 5, image: "https://via.placeholder.com/300x200" },
];

export default function App() {
  const location = useLocation();

  // Determina qual item da sidebar deve estar ativo
  const getActive = () => {
    if (location.pathname === "/estoque") return "Estoque";
    if (location.pathname === "/relatorios") return "Relatórios";
    if (location.pathname === "/configuracoes") return "Configurações";
    return undefined;
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar active={getActive()} />

      {/* Conteúdo principal */}
      <div className="relative flex-1">
        <main className="bg-gray-50 p-6 overflow-auto h-full">
          <Routes>
            {/* Redireciona a raiz para /estoque */}
            <Route path="/" element={<Navigate to="/estoque" replace />} />

            {/* Estoque */}
            <Route
              path="/estoque"
              element={
                <div>
                  <h1 className="text-2xl font-bold mb-6 text-gray-800">Estoque</h1>
                  <ProductCard products={sampleProducts} />
                </div>
              }
            />

            {/* Relatórios */}
            <Route path="/relatorios" element={<h1 className="text-2xl font-bold mb-6 text-gray-800">Relatórios</h1>} />

            {/* Configurações */}
            <Route path="/configuracoes" element={<h1 className="text-2xl font-bold mb-6 text-gray-800">Configurações</h1>} />

            {/* Rota não encontrada */}
            <Route path="*" element={<h1 className="text-2xl font-bold mb-6 text-gray-800">Rota não encontrada</h1>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
