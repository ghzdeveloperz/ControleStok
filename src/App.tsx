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
import {
  FaBoxes,
  FaPlus,
  FaChartBar,
  FaExclamationTriangle,
  FaCog,
} from "react-icons/fa";
import { Login } from "./pages/Login";

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem("loggedInUser"));
  const [loggedUser, setLoggedUser] = useState<string>(localStorage.getItem("loggedInUser") ?? "usuário");

  const handleLoginSuccess = (login: string) => {
    localStorage.setItem("loggedInUser", login);
    setLoggedUser(login);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedUser("usuário");
    setIsLoggedIn(false);
  };

  return (
    <LoadingProvider>
      <Routes>
        {!isLoggedIn && (
          <>
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {isLoggedIn && (
          <>
            <Route
              path="/*"
              element={<AppContent onLogout={handleLogout} loggedUser={loggedUser} />}
            />
          </>
        )}
      </Routes>
    </LoadingProvider>
  );
};

// ------------------- APP CONTENT -------------------
export const AppContent: React.FC<{ onLogout: () => void; loggedUser: string }> = ({
  onLogout,
  loggedUser,
}) => {
  const navigate = useNavigate();
  const [sidebarWidth, setSidebarWidth] = useState(260);

  const [logoSrc, setLogoSrc] = useState(localStorage.getItem("appLogo") ?? "/images/jinjin-banner.png");
  const storedProfile = localStorage.getItem("profileImage");
  const [profileSrc, setProfileSrc] = useState(
    storedProfile ? `${storedProfile}?t=${Date.now()}` : "/images/profile-200.jpg"
  );

  const userID = loggedUser;

  const { products, loading } = useProducts(userID);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [zeroStockCount, setZeroStockCount] = useState<number>(0);

  useEffect(() => {
    if (loading) return;
    let low = 0;
    let zero = 0;

    products.forEach((p) => {
      const qty = Number(p.quantity ?? 0);
      const min = Number(p.minStock ?? 10);

      if (qty === 0) zero++;
      else if (qty > 0 && qty <= min) low++;
    });

    setLowStockCount(low);
    setZeroStockCount(zero);
  }, [products, loading]);

  return (
    <>
      {/* CONTAINER PRINCIPAL AJUSTADO */}
      <div className="flex min-h-screen w-full overflow-x-hidden overflow-y-auto">
        <Sidebar
          width={sidebarWidth}
          setWidth={setSidebarWidth}
          logoSrc={logoSrc}
          profileSrc={profileSrc}
          userId={userID}
          lowStockCount={lowStockCount}
          zeroStockCount={zeroStockCount}
        />

        <div
          className="page-content flex-1 bg-gray-50 scroll-smooth min-h-screen md:ml-(--sidebar-w) transition-all duration-150 relative"
          style={{ ["--sidebar-w" as any]: `${sidebarWidth}px` }}
        >

          <Routes>
            <Route path="/" element={<Navigate to="/estoque" replace />} />

            <Route path="/estoque" element={<Estoque userId={userID} />} />
            <Route path="/estoque/novoproduto" element={<NovoProduto userId={userID} />} />
            <Route path="/relatorios" element={<Relatorios userId={userID} />} />
            <Route path="/alertas" element={<Alertas userId={userID} />} />

            <Route
              path="/configuracoes"
              element={
                <Configuracoes
                  userId={userID}
                  onLogoChange={(newLogo) => {
                    setLogoSrc(newLogo);
                    localStorage.setItem("appLogo", newLogo);
                  }}
                  onProfileChange={(newProfile) => {
                    const updatedProfile = `${newProfile}?t=${Date.now()}`;
                    setProfileSrc(updatedProfile);
                    localStorage.setItem("profileImage", newProfile);
                  }}
                  onLogout={onLogout}
                />
              }
            />

            <Route path="*" element={<Navigate to="/estoque" replace />} />
          </Routes>

          {/* FOOTER MÓVEL */}
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 flex justify-around items-center py-3 md:hidden z-50 shadow-lg rounded-t-2xl">
            <MobileItem
              active={window.location.pathname === "/estoque"}
              icon={<FaBoxes size={22} />}
              label="Estoque"
              onClick={() => navigate("/estoque")}
            />

            <MobileItem
              active={window.location.pathname === "/estoque/novoproduto"}
              icon={<FaPlus size={22} />}
              label="Novo"
              onClick={() => navigate("/estoque/novoproduto")}
            />

            <MobileItem
              active={window.location.pathname === "/relatorios"}
              icon={<FaChartBar size={22} />}
              label="Relatórios"
              onClick={() => navigate("/relatorios")}
            />

            <MobileItem
              active={window.location.pathname === "/alertas"}
              icon={<FaExclamationTriangle size={22} />}
              label="Alertas"
              onClick={() => navigate("/alertas")}
              low={lowStockCount}
              zero={zeroStockCount}
            />

            <MobileItem
              active={window.location.pathname === "/configuracoes"}
              icon={<FaCog size={22} />}
              label="Config"
              onClick={() => navigate("/configuracoes")}
            />
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------- MOBILE ITEM ----------------------
function MobileItem({
  icon,
  label,
  active,
  onClick,
  low = 0,
  zero = 0,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  low?: number;
  zero?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center px-3 py-1.5 rounded-xl transition-all ${active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
        }`}
    >
      <div className="relative">
        {icon}
        <div className="absolute -top-1 -right-2 flex gap-0.5">
          {low > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {low}
            </span>
          )}
          {zero > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {zero}
            </span>
          )}
        </div>
      </div>
      <span className={`text-xs mt-1 ${active ? "text-white" : "text-gray-700"}`}>
        {label}
      </span>
    </button>
  );
}
