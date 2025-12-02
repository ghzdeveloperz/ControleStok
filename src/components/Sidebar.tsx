// src/components/Sidebar.tsx
import React, { useState } from "react";
import { FaBoxes, FaChartBar, FaCog, FaBars, FaPlus, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  logoSrc?: string;
  profileSrc?: string;
  userId?: string;
  lowStockCount?: number;   // quantidade produtos baixos
  zeroStockCount?: number;  // quantidade produtos zerados
}

export function Sidebar({ logoSrc, profileSrc, userId, lowStockCount = 0, zeroStockCount = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const sidebarWidth = collapsed ? 80 : 256;
  const navigate = useNavigate();
  const location = useLocation();

  const toggleCollapse = () => setCollapsed(!collapsed);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className="flex flex-col h-screen relative overflow-visible"
      style={{
        width: sidebarWidth,
        transition: "width 0.3s ease",
        backgroundColor: "#ececec",
      }}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        {!collapsed && (
          <img
            src={logoSrc || "/images/jinjin-banner.png"}
            alt="Logo"
            className="h-10 w-auto"
          />
        )}

        <button
          onClick={toggleCollapse}
          className="p-2 rounded hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <FaBars size={20} color="#1f1f1f" />
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4 flex flex-col flex-1 items-stretch gap-2">
        <SidebarItem
          collapsed={collapsed}
          icon={FaBoxes}
          label="Estoque"
          active={isActive("/estoque")}
          sidebarWidth={sidebarWidth}
          onClick={() => navigate("/estoque")}
        />

        <SidebarItem
          collapsed={collapsed}
          icon={FaPlus}
          label="Novo Produto"
          active={isActive("/estoque/novoproduto")}
          sidebarWidth={sidebarWidth}
          onClick={() => navigate("/estoque/novoproduto")}
          indent
        />

        <SidebarItem
          collapsed={collapsed}
          icon={FaChartBar}
          label="Relatórios"
          active={isActive("/relatorios")}
          sidebarWidth={sidebarWidth}
          onClick={() => navigate("/relatorios")}
        />

        <SidebarItem
          collapsed={collapsed}
          icon={FaExclamationTriangle}
          label="Alertas"
          active={isActive("/alertas")}
          sidebarWidth={sidebarWidth}
          onClick={() => navigate("/alertas")}
          badgeRight={
            !collapsed && (
              <div className="flex gap-1 ml-auto">
                {lowStockCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {lowStockCount}
                  </span>
                )}
                {zeroStockCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {zeroStockCount}
                  </span>
                )}
              </div>
            )
          }
        />

        <SidebarItem
          collapsed={collapsed}
          icon={FaCog}
          label="Configurações"
          active={isActive("/configuracoes")}
          sidebarWidth={sidebarWidth}
          onClick={() => navigate("/configuracoes")}
        />
      </nav>

      {/* Rodapé */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center">
        <div
          className={`relative flex items-center ${collapsed ? "justify-center" : "justify-start"
            } gap-3 bg-black rounded-full px-3 py-2`}
          style={{ width: collapsed ? 60 : sidebarWidth - 16 }}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
            <img
              src={profileSrc ?? "../images/default-profile.png"}
              className="w-10 h-10 rounded-full object-cover"
              alt="Foto"
            />
          </div>

          {!collapsed && (
            <span
              className="text-white font-semibold text-sm truncate"
              style={{ maxWidth: sidebarWidth - 80 }}
            >
              {userId ?? "xxxxx"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  collapsed: boolean;
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  sidebarWidth?: number;
  indent?: boolean;
  badgeRight?: React.ReactNode; // permite adicionar badge no lado direito
}

function SidebarItem({
  collapsed,
  icon: Icon,
  label,
  active,
  onClick,
  sidebarWidth,
  indent = false,
  badgeRight,
}: SidebarItemProps) {
  const marginLeft = collapsed ? 0 : indent ? 16 : 0;
  const paddingY = indent ? "py-2.5" : "py-3.5";

  return (
    <div
      onClick={onClick}
      className={`flex items-center ${collapsed ? "justify-center" : "justify-start"
        } gap-3 px-4 ${paddingY} cursor-pointer transition-colors duration-300 ${active
          ? "bg-black text-white rounded-lg mx-2"
          : "hover:bg-gray-200 text-gray-700 rounded-lg mx-2"
        }`}
      style={{ marginLeft }}
    >
      <Icon size={22} color={active ? "#ffffff" : "#1f1f1f"} />
      <div
        style={{
          width: collapsed
            ? 0
            : sidebarWidth
              ? sidebarWidth - 60
              : 180,
          overflow: "hidden",
          transition: "width 0.3s ease",
        }}
      >
        <span className="whitespace-nowrap">{label}</span>
      </div>
      {badgeRight}
    </div>
  );
}
