// src/components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import {
  FaBoxes,
  FaChartBar,
  FaCog,
  FaBars,
  FaPlus,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  logoSrc?: string;
  profileSrc?: string;
  userId?: string;
  lowStockCount?: number;
  zeroStockCount?: number;
}

export function Sidebar({
  logoSrc,
  profileSrc,
  userId,
  lowStockCount = 0,
  zeroStockCount = 0,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 80 : 256;

  const navigate = useNavigate();
  const location = useLocation();

  const toggleCollapse = () => setCollapsed(!collapsed);
  const isActive = (path: string) => location.pathname === path;

  const compactBadge = lowStockCount + zeroStockCount;

  /* ------------------ FIX DO MOBILE: EVITA CONTEÚDO TAMPADO ------------------ */
  useEffect(() => {
    const padding = "calc(72px + env(safe-area-inset-bottom, 0px))";
    const root = document.documentElement;

    const applyPadding = () => {
      if (window.innerWidth < 768) {
        root.style.setProperty("--mobile-bottom-padding", padding);
      } else {
        root.style.setProperty("--mobile-bottom-padding", "0px");
      }
    };

    applyPadding();
    window.addEventListener("resize", applyPadding);
    return () => window.removeEventListener("resize", applyPadding);
  }, []);
  /* ---------------------------------------------------------------------------- */

  return (
    <>
      {/* SIDEBAR DESKTOP */}
      <div
        className="hidden md:flex flex-col h-screen relative overflow-visible"
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

          {/* ALERTAS */}
          <SidebarItem
            collapsed={collapsed}
            icon={FaExclamationTriangle}
            label="Alertas"
            active={isActive("/alertas")}
            sidebarWidth={sidebarWidth}
            onClick={() => navigate("/alertas")}
            badgeRight={
              collapsed ? (
                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                  {lowStockCount > 0 && (
                    <span className="bg-orange-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
                      {lowStockCount}
                    </span>
                  )}
                  {zeroStockCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
                      {zeroStockCount}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex gap-1 ml-auto pr-2">
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
        <div className="absolute bottom-4 left-0 w-full flex justify-center px-2">
          <div
            className={`relative flex items-center ${
              collapsed ? "justify-center" : "justify-start"
            } gap-3 bg-black rounded-full px-3 py-2`}
            style={{ width: collapsed ? 60 : sidebarWidth - 16 }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
              <img
                src={profileSrc ?? "/images/default-profile.png"}
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

      {/* MOBILE NAVBAR */}
      <div
        className="
        fixed bottom-0 left-0 w-full bg-white 
        border-t border-gray-300 
        flex justify-around items-center 
        py-3 md:hidden z-50
        shadow-lg
        rounded-t-2xl
      "
      >
        <MobileItem
          active={isActive("/estoque")}
          icon={<FaBoxes size={22} />}
          label="Estoque"
          onClick={() => navigate("/estoque")}
        />

        <MobileItem
          active={isActive("/estoque/novoproduto")}
          icon={<FaPlus size={22} />}
          label="Novo"
          onClick={() => navigate("/estoque/novoproduto")}
        />

        <MobileItem
          active={isActive("/relatorios")}
          icon={<FaChartBar size={22} />}
          label="Relatórios"
          onClick={() => navigate("/relatorios")}
        />

        <MobileItem
          active={isActive("/alertas")}
          icon={<FaExclamationTriangle size={22} />}
          label="Alertas"
          onClick={() => navigate("/alertas")}
          low={lowStockCount}
          zero={zeroStockCount}
        />

        <MobileItem
          active={isActive("/configuracoes")}
          icon={<FaCog size={22} />}
          label="Config"
          onClick={() => navigate("/configuracoes")}
        />
      </div>

      {/* CSS RESPONSIVO PARA O ESPAÇAMENTO */}
      <style>
        {`
          main, .page-content, .content, .cards-area, body {
            padding-bottom: var(--mobile-bottom-padding, 0px) !important;
          }
        `}
      </style>
    </>
  );
}

/* ---------------- ITEM MOBILE ---------------- */

function MobileItem({
  icon,
  label,
  active,
  onClick,
  low,
  zero,
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
      className={`
        relative flex flex-col items-center px-3 py-1.5 rounded-xl transition-all 
        ${active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"}
      `}
    >
      <div className="relative">
        {icon}

        <div className="absolute -top-1 -right-2 flex gap-0.5">
          {low! > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {low}
            </span>
          )}
          {zero! > 0 && (
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

/* ---------------- ITEM DESKTOP ---------------- */

interface SidebarItemProps {
  collapsed: boolean;
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  sidebarWidth?: number;
  indent?: boolean;
  badgeRight?: React.ReactNode;
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
      className={`
        flex items-center 
        ${collapsed ? "justify-center" : "justify-start"}
        gap-3 px-4 ${paddingY} cursor-pointer transition-colors duration-300
        ${
          active
            ? "bg-black text-white rounded-lg mx-2"
            : "hover:bg-gray-200 text-gray-700 rounded-lg mx-2"
        }
        relative
      `}
      style={{ marginLeft }}
    >
      <div className="relative">
        <Icon size={22} color={active ? "#ffffff" : "#1f1f1f"} />
      </div>

      {!collapsed && (
        <div
          style={{
            width: sidebarWidth ? sidebarWidth - 60 : 180,
            overflow: "hidden",
            transition: "width 0.3s ease",
          }}
        >
          <span className="whitespace-nowrap">{label}</span>
        </div>
      )}

      {badgeRight}
    </div>
  );
}
