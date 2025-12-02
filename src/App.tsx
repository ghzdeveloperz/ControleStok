// src/App.tsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import Estoque from "./pages/Estoque";
import Relatorios from "./pages/Relatorios";
import { Configuracoes } from "./pages/Configuracoes";
import { NovoProduto } from "./pages/NovoProduto";
import { Alertas } from "./pages/Alertas";
import { LoadingProvider } from "./contexts/LoadingContext";
import { useProducts } from "./hooks/useProducts";

export const AppContent: React.FC = () => {
  const navigate = useNavigate();

  const [logoSrc, setLogoSrc] = useState(
    localStorage.getItem("appLogo") ?? "/images/jinjin-banner.png"
  );

  const storedProfile = localStorage.getItem("profileImage");
  const [profileSrc, setProfileSrc] = useState(
    storedProfile ? `${storedProfile}?t=${Date.now()}` : "/images/profile-200.jpg"
  );

  const [userID] = useState("usuário");

  // Hook de produtos
  const { products } = useProducts();

  // Contadores para a Sidebar
  const [lowStockCount, setLowStockCount] = useState(0);
  const [zeroStockCount, setZeroStockCount] = useState(0);

  useEffect(() => {
    let low = 0;
    let zero = 0;
    products.forEach((p) => {
      const qty = p.quantity ?? 0;
      if (qty === 0) zero++;
      else if (qty <= 10) low++;
    });
    setLowStockCount(low);
    setZeroStockCount(zero);
  }, [products]);

  const handleLogout = () => {
    localStorage.removeItem("profileImage");
    localStorage.removeItem("appLogo");
    setLogoSrc("/images/jinjin-banner.png");
    setProfileSrc("/images/profile-200.jpg");
    navigate("/estoque");
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        logoSrc={logoSrc}
        profileSrc={profileSrc}
        userId={userID}
        lowStockCount={lowStockCount}
        zeroStockCount={zeroStockCount}
      />

      <div className="flex-1 bg-gray-50 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/estoque" replace />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/estoque/novoproduto" element={<NovoProduto />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/alertas" element={<Alertas />} />

          <Route
            path="/configuracoes"
            element={
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
            }
          />

          <Route path="*" element={<Navigate to="/estoque" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <LoadingProvider>
    <AppContent />
  </LoadingProvider>
);
