import React, { useState } from "react";
import { FaBoxes, FaChartBar, FaCog, FaBars, FaPlus } from "react-icons/fa";

interface SidebarProps {
  active?: "Estoque" | "NovoProduto" | "Relatórios" | "Configurações";
  onNavigate?: (
    page: "Estoque" | "NovoProduto" | "Relatórios" | "Configurações"
  ) => void;
  logoSrc?: string;
  profileSrc?: string;
  userId?: string;
}

export function Sidebar({
  active,
  onNavigate,
  logoSrc,
  profileSrc,
  userId,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const sidebarWidth = collapsed ? 70 : 240; // leve redução

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div
      className="flex flex-col h-screen relative overflow-visible"
      style={{
        width: sidebarWidth,
        transition: "width 0.25s ease",
        backgroundColor: "#ececec",
      }}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b border-gray-300">
        {!collapsed && (
          <img
            src={logoSrc ?? "/images/jinjin-banner.png"}
            alt="Logo"
            className="h-9 w-auto"
          />
        )}

        <button
          onClick={toggleCollapse}
          className="p-2 rounded hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <FaBars size={18} color="#1f1f1f" />
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-3 flex flex-col flex-1 gap-1">
        <SidebarItem
          collapsed={collapsed}
          icon={FaBoxes}
          label="Estoque"
          active={active === "Estoque"}
          onClick={() => onNavigate?.("Estoque")}
        />

        <SidebarItem
          collapsed={collapsed}
          icon={FaPlus}
          label="Novo Produto"
          active={active === "NovoProduto"}
          onClick={() => onNavigate?.("NovoProduto")}
          indent
        />

        <SidebarItem
          collapsed={collapsed}
          icon={FaChartBar}
          label="Relatórios"
          active={active === "Relatórios"}
          onClick={() => onNavigate?.("Relatórios")}
        />

        <SidebarItem
          collapsed={collapsed}
          icon={FaCog}
          label="Configurações"
          active={active === "Configurações"}
          onClick={() => onNavigate?.("Configurações")}
        />
      </nav>

      {/* Rodapé */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center">
        <div
          className={`relative flex items-center ${
            collapsed ? "justify-center" : "justify-start"
          } gap-2 bg-black rounded-full px-3 py-2`}
          style={{ width: collapsed ? 55 : sidebarWidth - 20 }}
        >
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white">
            <img
              src={profileSrc ?? "/images/default-profile.png"}
              className="w-9 h-9 rounded-full object-cover"
              alt="Foto"
            />
          </div>

          {!collapsed && (
            <span className="text-white font-semibold text-sm truncate">
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
  indent?: boolean;
}

function SidebarItem({
  collapsed,
  icon: Icon,
  label,
  active,
  onClick,
  indent = false,
}: SidebarItemProps) {
  const basePadding = collapsed ? "py-3" : "py-2";
  const marginLeft = collapsed ? 0 : indent ? 18 : 0; // indent mais discreto

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center 
        ${collapsed ? "justify-center" : "justify-start"} 
        gap-3 cursor-pointer select-none 
        rounded-md transition-colors duration-200
        ${basePadding}
        ${active ? "bg-black text-white" : "hover:bg-gray-200 text-gray-700"}
        mx-1
      `}
      style={{ marginLeft }}
    >
      <Icon size={20} color={active ? "#ffffff" : "#1f1f1f"} />

      {!collapsed && (
        <span className="whitespace-nowrap text-sm">{label}</span>
      )}
    </div>
  );
}
