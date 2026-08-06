import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { FaBoxes, FaChartBar, FaCog, FaExclamationTriangle, FaPlus } from "react-icons/fa";
import { Sidebar } from "../../components/Sidebar";
import { useProducts } from "../../hooks/useProducts";
import type { AuthSession } from "../../features/auth/domain/auth.types";
import { Alertas } from "../../pages/Alertas";
import { Configuracoes } from "../../pages/Configuracoes";
import Estoque from "../../pages/Estoque";
import { NovoProduto } from "../../pages/NovoProduto";
import Relatorios from "../../pages/Relatorios";
import { sanitizeImageSource } from "../../utils/imageValidation";
import { getWorkspaceAssetKey, removeLegacyAssetKeys } from "../../utils/workspaceStorage";
import { routePaths } from "../router/route-paths";

export interface WorkspaceLayoutProps {
  readonly session: AuthSession;
  readonly onLogout: () => Promise<void>;
}

export const WorkspaceLayout = ({ session, onLogout }: WorkspaceLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const workspaceId = session.workspaceId;
  const logoStorageKey = getWorkspaceAssetKey(workspaceId, "appLogo");
  const profileStorageKey = getWorkspaceAssetKey(workspaceId, "profileImage");
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [logoSrc, setLogoSrc] = useState(() =>
    sanitizeImageSource(localStorage.getItem(logoStorageKey), "/images/jinjin-banner.png"),
  );
  const [profileSrc, setProfileSrc] = useState(() =>
    sanitizeImageSource(localStorage.getItem(profileStorageKey), "/images/profile-200.jpg"),
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
        else if (quantity > 0 && quantity <= minStock) counts.lowStockCount += 1;
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
            <Route path="/" element={<Navigate to={routePaths.inventory} replace />} />
            <Route path={routePaths.inventory} element={<Estoque userId={workspaceId} />} />
            <Route path={routePaths.newProduct} element={<NovoProduto userId={workspaceId} />} />
            <Route path={routePaths.reports} element={<Relatorios userId={workspaceId} />} />
            <Route path={routePaths.alerts} element={<Alertas userId={workspaceId} />} />
            <Route
              path={routePaths.settings}
              element={
                <Configuracoes
                  key={workspaceId}
                  userId={workspaceId}
                  onLogoChange={setLogoSrc}
                  onProfileChange={setProfileSrc}
                  onLogout={onLogout}
                />
              }
            />
            <Route path="*" element={<Navigate to={routePaths.inventory} replace />} />
          </Routes>
        </div>

        <div className="flex w-full items-center justify-around border-t border-gray-300 bg-white py-3 shadow-lg md:hidden">
          <MobileItem
            active={location.pathname === routePaths.inventory}
            icon={<FaBoxes size={22} />}
            label="Estoque"
            onClick={() => navigate(routePaths.inventory)}
          />
          <MobileItem
            active={location.pathname === routePaths.newProduct}
            icon={<FaPlus size={22} />}
            label="Novo"
            onClick={() => navigate(routePaths.newProduct)}
          />
          <MobileItem
            active={location.pathname === routePaths.reports}
            icon={<FaChartBar size={22} />}
            label="Relatórios"
            onClick={() => navigate(routePaths.reports)}
          />
          <MobileItem
            active={location.pathname === routePaths.alerts}
            icon={<FaExclamationTriangle size={22} />}
            label="Alertas"
            onClick={() => navigate(routePaths.alerts)}
            low={lowStockCount}
            zero={zeroStockCount}
          />
          <MobileItem
            active={location.pathname === routePaths.settings}
            icon={<FaCog size={22} />}
            label="Config"
            onClick={() => navigate(routePaths.settings)}
          />
        </div>
      </div>
    </div>
  );
};

interface MobileItemProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly active?: boolean;
  readonly onClick: () => void;
  readonly low?: number;
  readonly zero?: number;
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
        {low > 0 ? (
          <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {low}
          </span>
        ) : null}
        {zero > 0 ? (
          <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {zero}
          </span>
        ) : null}
      </div>
    </div>
    <span className="mt-1 text-xs">{label}</span>
  </button>
);
