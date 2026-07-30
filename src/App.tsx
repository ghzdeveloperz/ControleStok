import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FaBoxes,
  FaChartBar,
  FaCog,
  FaExclamationTriangle,
  FaPlus,
} from "react-icons/fa";
import { Sidebar } from "./components/Sidebar";
import { useAuth } from "./hooks/useAuth";
import { useProducts } from "./hooks/useProducts";
import type { AuthSession } from "./contexts/auth-context";
import { Alertas } from "./pages/Alertas";
import { Configuracoes } from "./pages/Configuracoes";
import Estoque from "./pages/Estoque";
import Home from "./pages/Home";
import { Login } from "./pages/Login";
import { NovoProduto } from "./pages/NovoProduto";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Relatorios from "./pages/Relatorios";
import TermsOfUse from "./pages/TermsOfUse";
import { sanitizeImageSource } from "./utils/imageValidation";
import {
  getWorkspaceAssetKey,
  removeLegacyAssetKeys,
} from "./utils/workspaceStorage";

export const App = () => {
  const { initializing, session, logout } = useAuth();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
        Carregando sessão...
      </div>
    );
  }

  return (
    <Routes>
      {!session ? (
        <>
          <Route path="/" element={<Home />} />
          <Route path="/politics-privacy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <Route
          path="/*"
          element={
            <AppContent
              key={session.workspaceId}
              session={session}
              onLogout={logout}
            />
          }
        />
      )}
    </Routes>
  );
};

interface AppContentProps {
  onLogout: () => Promise<void>;
  session: AuthSession;
}

const AppContent = ({ onLogout, session }: AppContentProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceId = session.workspaceId;
  const logoStorageKey = getWorkspaceAssetKey(workspaceId, "appLogo");
  const profileStorageKey = getWorkspaceAssetKey(workspaceId, "profileImage");
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [logoSrc, setLogoSrc] = useState(
    () =>
      sanitizeImageSource(
        localStorage.getItem(logoStorageKey),
        "/images/jinjin-banner.png",
      ),
  );
  const [profileSrc, setProfileSrc] = useState(
    () =>
      sanitizeImageSource(
        localStorage.getItem(profileStorageKey),
        "/images/profile-200.jpg",
      ),
  );

  const { products, loading } = useProducts(workspaceId);

  useEffect(() => {
    removeLegacyAssetKeys();
  }, []);

  const { lowStockCount, zeroStockCount } = useMemo(() => {
    if (loading) return { lowStockCount: 0, zeroStockCount: 0 };

    return products.reduce(
      (counts, product) => {
        const quantity = Number(product.quantity ?? 0);
        const minStock = Number(product.minStock ?? 10);

        if (quantity === 0) counts.zeroStockCount += 1;
        else if (quantity > 0 && quantity <= minStock) {
          counts.lowStockCount += 1;
        }
        return counts;
      },
      { lowStockCount: 0, zeroStockCount: 0 },
    );
  }, [loading, products]);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar
        width={sidebarWidth}
        setWidth={setSidebarWidth}
        logoSrc={logoSrc}
        profileSrc={profileSrc}
        userId={session.login}
        lowStockCount={lowStockCount}
        zeroStockCount={zeroStockCount}
      />

      <div className="flex flex-1 flex-col bg-gray-50">
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/estoque" replace />} />
            <Route path="/estoque" element={<Estoque userId={workspaceId} />} />
            <Route
              path="/estoque/novoproduto"
              element={<NovoProduto userId={workspaceId} />}
            />
            <Route
              path="/relatorios"
              element={<Relatorios userId={workspaceId} />}
            />
            <Route
              path="/alertas"
              element={<Alertas userId={workspaceId} />}
            />
            <Route
              path="/configuracoes"
              element={
                <Configuracoes
                  key={workspaceId}
                  userId={workspaceId}
                  onLogoChange={(newLogo) => {
                    setLogoSrc(newLogo);
                  }}
                  onProfileChange={(newProfile) => {
                    setProfileSrc(newProfile);
                  }}
                  onLogout={onLogout}
                />
              }
            />
            <Route path="*" element={<Navigate to="/estoque" replace />} />
          </Routes>
        </div>

        <div className="flex w-full items-center justify-around border-t border-gray-300 bg-white py-3 shadow-lg md:hidden">
          <MobileItem
            active={location.pathname === "/estoque"}
            icon={<FaBoxes size={22} />}
            label="Estoque"
            onClick={() => navigate("/estoque")}
          />
          <MobileItem
            active={location.pathname === "/estoque/novoproduto"}
            icon={<FaPlus size={22} />}
            label="Novo"
            onClick={() => navigate("/estoque/novoproduto")}
          />
          <MobileItem
            active={location.pathname === "/relatorios"}
            icon={<FaChartBar size={22} />}
            label="Relatórios"
            onClick={() => navigate("/relatorios")}
          />
          <MobileItem
            active={location.pathname === "/alertas"}
            icon={<FaExclamationTriangle size={22} />}
            label="Alertas"
            onClick={() => navigate("/alertas")}
            low={lowStockCount}
            zero={zeroStockCount}
          />
          <MobileItem
            active={location.pathname === "/configuracoes"}
            icon={<FaCog size={22} />}
            label="Config"
            onClick={() => navigate("/configuracoes")}
          />
        </div>
      </div>
    </div>
  );
};

interface MobileItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  low?: number;
  zero?: number;
}

const MobileItem = ({
  icon,
  label,
  active = false,
  onClick,
  low = 0,
  zero = 0,
}: MobileItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex flex-col items-center rounded-xl px-3 py-1.5 transition-all ${
      active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
    }`}
  >
    <div className="relative">
      {icon}
      <div className="absolute -right-2 -top-1 flex gap-0.5">
        {low > 0 && (
          <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {low}
          </span>
        )}
        {zero > 0 && (
          <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {zero}
          </span>
        )}
      </div>
    </div>
    <span className="mt-1 text-xs">{label}</span>
  </button>
);
