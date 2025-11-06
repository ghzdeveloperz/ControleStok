import React, { useState } from "react";
import { FaBoxes, FaChartBar, FaCog, FaBars } from "react-icons/fa";

interface SidebarProps {
  active?: "Estoque" | "Relatórios" | "Configurações";
  onNavigate?: (page: "Estoque" | "Relatórios" | "Configurações") => void;
  logoSrc?: string;
  profileSrc?: string;
  userId?: string;
}

export function Sidebar({ active, onNavigate, logoSrc, profileSrc, userId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const sidebarWidth = collapsed ? 80 : 256;

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div
      className="flex flex-col h-screen relative overflow-visible"
      style={{ width: sidebarWidth, transition: "width 0.3s ease", backgroundColor: "#ececec" }}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        {!collapsed && <img src={logoSrc ?? "/images/sua-logo.png"} alt="Logo" className="h-10 w-auto" />}
        <button onClick={toggleCollapse} className="p-2 rounded hover:bg-gray-200 transition-colors cursor-pointer">
          <FaBars size={20} color="#1f1f1f" />
        </button>
      </div>

      {/* Menu */}
      <nav className="mt-4 flex flex-col flex-1 items-stretch gap-3">
        <SidebarItem
          collapsed={collapsed}
          icon={FaBoxes}
          label="Estoque"
          active={active === "Estoque"}
          sidebarWidth={sidebarWidth}
          onClick={() => onNavigate?.("Estoque")}
        />
        <SidebarItem
          collapsed={collapsed}
          icon={FaChartBar}
          label="Relatórios"
          active={active === "Relatórios"}
          sidebarWidth={sidebarWidth}
          onClick={() => onNavigate?.("Relatórios")}
        />
        <SidebarItem
          collapsed={collapsed}
          icon={FaCog}
          label="Configurações"
          active={active === "Configurações"}
          sidebarWidth={sidebarWidth}
          onClick={() => onNavigate?.("Configurações")}
        />
      </nav>

      {/* Rodapé */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center">
        <div
          className={`relative flex items-center ${collapsed ? "justify-center" : "justify-start"} gap-3 bg-black rounded-full px-3 py-2`}
          style={{ width: collapsed ? 60 : sidebarWidth - 16 }}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
            <img
              key={profileSrc}
              src={profileSrc}
              alt="Profile"
              className="w-full h-full object-cover"
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

// SidebarItem separado
interface SidebarItemProps {
  collapsed: boolean;
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  sidebarWidth?: number;
}

function SidebarItem({ collapsed, icon: Icon, label, active, onClick, sidebarWidth }: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} gap-3 p-4 cursor-pointer transition-colors duration-300 ${
        active ? "bg-black text-white rounded-lg mx-2" : "hover:bg-gray-200 text-gray-700 rounded-lg mx-2"
      }`}
    >
      <Icon size={22} color={active ? "#ffffff" : "#1f1f1f"} />
      <div
        style={{
          width: collapsed ? 0 : sidebarWidth ? sidebarWidth - 60 : 180,
          overflow: "hidden",
          transition: "width 0.3s ease",
        }}
      >
        <span className="whitespace-nowrap">{label}</span>
      </div>
    </div>
  );
}
