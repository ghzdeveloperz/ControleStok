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
import { FaBarcode } from "react-icons/fa";


interface SidebarProps {
  logoSrc?: string;
  profileSrc?: string;
  userId?: string;
  lowStockCount?: number | null;
  zeroStockCount?: number | null;
  loading?: boolean;
  width: number;
  setWidth: (newWidth: number) => void;
}

export function Sidebar({
  logoSrc,
  profileSrc,
  userId,
  lowStockCount = 0,
  zeroStockCount = 0,
  loading = false,
  width,
  setWidth,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    setWidth(!collapsed ? 80 : 256);
  };

  const isActive = (path: string) => location.pathname === path;

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

  // Garantir que nunca entre null
  const safeLowStock = typeof lowStockCount === "number" ? lowStockCount : 0;
  const safeZeroStock = typeof zeroStockCount === "number" ? zeroStockCount : 0;

  const SkeletonBadge = () => (
    <span className="w-6 h-4 bg-gray-300 rounded-full animate-pulse"></span>
  );

  return (
    <>
      <div
        className="hidden md:flex flex-col h-screen fixed top-0 left-0 z-40 shadow-lg"
        style={{
          width,
          transition: "width 0.15s ease",
          backgroundColor: "#ececec",
        }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
          {!collapsed && (
            <img
              src={logoSrc || "/images/jinjin-banner.png"}
              alt="Logo"
              className="h-10 w-auto max-w-[calc(100%-40px)] truncate"
            />
          )}
          <button
            onClick={toggleCollapse}
            className="p-2 rounded hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <FaBars size={20} color="#1f1f1f" />
          </button>
        </div>

        {/* MENU */}
        <nav className="mt-4 flex flex-col flex-1 items-stretch gap-2 overflow-x-auto">
          <SidebarItem
            collapsed={collapsed}
            icon={FaBoxes}
            label="Estoque"
            active={isActive("/estoque")}
            width={width}
            onClick={() => navigate("/estoque")}
          />
          <SidebarItem
            collapsed={collapsed}
            icon={FaPlus}
            label="Novo Produto"
            active={isActive("/estoque/novoproduto")}
            width={width}
            onClick={() => navigate("/estoque/novoproduto")}
            indent
          />

          <SidebarItem
            collapsed={collapsed}
            icon={FaChartBar}
            label="Relatórios"
            active={isActive("/relatorios")}
            width={width}
            onClick={() => navigate("/relatorios")}
          />

          <SidebarItem
            collapsed={collapsed}
            icon={FaExclamationTriangle}
            label="Alertas"
            active={isActive("/alertas")}
            width={width}
            onClick={() => navigate("/alertas")}
            badgeRight={
              collapsed ? (
                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                  {loading ? (
                    <>
                      <SkeletonBadge />
                      <SkeletonBadge />
                    </>
                  ) : (
                    <>
                      {safeLowStock > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
                          {safeLowStock}
                        </span>
                      )}
                      {safeZeroStock > 0 && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-1 py-0.5 rounded-full">
                          {safeZeroStock}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex gap-1 ml-auto pr-2">
                  {loading ? (
                    <>
                      <SkeletonBadge />
                      <SkeletonBadge />
                    </>
                  ) : (
                    <>
                      {safeLowStock > 0 && (
                        <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {safeLowStock}
                        </span>
                      )}
                      {safeZeroStock > 0 && (
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {safeZeroStock}
                        </span>
                      )}
                    </>
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
            width={width}
            onClick={() => navigate("/configuracoes")}
          />

          <SidebarItem
            collapsed={collapsed}
            icon={FaBarcode}
            label="Scanner"
            active={isActive("/scanner")}
            width={width}
            onClick={() => navigate("/scanner")}
          />

        </nav>

        {/* FOOTER */}
        <div className="absolute bottom-4 left-0 w-full flex justify-center px-2">
          <div
            className={`relative flex items-center ${collapsed ? "justify-center" : "justify-start"
              } gap-3 bg-black rounded-full px-3 py-2`}
            style={{ width: collapsed ? 60 : width - 16 }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shrink-0">
              <img
                src={profileSrc ?? "/images/default-profile.png"}
                className="w-10 h-10 rounded-full object-cover"
                alt="Foto"
              />
            </div>

            {!collapsed && (
              <span
                className="text-white font-semibold text-sm truncate"
                style={{ maxWidth: width - 80 }}
              >
                {userId ?? "xxxxx"}
              </span>
            )}
          </div>
        </div>

        {/* RESIZE HANDLE */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gray-400"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startWidth = width;

            const onMove = (ev: MouseEvent) => {
              const newWidth = startWidth + (ev.clientX - startX);
              const clamped = Math.min(Math.max(newWidth, 150), 450);
              setWidth(clamped);
            };

            const onUp = () => {
              document.removeEventListener("mousemove", onMove);
              document.removeEventListener("mouseup", onUp);
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
          }}
        />
      </div>
    </>
  );
}

/* ---------------------- ITEM DESKTOP ---------------------- */
interface SidebarItemProps {
  collapsed: boolean;
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  width: number;
  indent?: boolean;
  badgeRight?: React.ReactNode;
}

function SidebarItem({
  collapsed,
  icon: Icon,
  label,
  active,
  onClick,
  width,
  indent = false,
  badgeRight,
}: SidebarItemProps) {
  const marginLeft = collapsed ? 0 : indent ? 16 : 0;

  return (
    <div
      onClick={onClick}
      className={`flex items-center 
        ${collapsed ? "justify-center" : "justify-start"}
        gap-3 px-4 py-3 cursor-pointer transition-colors duration-300
        ${active
          ? "bg-black text-white rounded-lg mx-2"
          : "hover:bg-gray-200 text-gray-700 rounded-lg mx-2"
        }
        relative`}
      style={{ marginLeft }}
    >
      <Icon size={22} color={active ? "#ffffff" : "#1f1f1f"} />
      {!collapsed && (
        <span
          className="whitespace-nowrap overflow-hidden overflow-ellipsis"
          style={{ width: width - 80 }}
        >
          {label}
        </span>
      )}
      {badgeRight}
    </div>
  );
}
