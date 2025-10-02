// src/components/Sidebar.tsx
import { useState } from "react";
import { FaBoxes, FaChartBar, FaCog, FaBars } from "react-icons/fa";

interface SidebarProps {
  active?: "Estoque" | "Relatórios" | "Configurações";
  onNavigate?: (page: "Estoque" | "Relatórios" | "Configurações") => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div
      className={`h-screen flex flex-col transition-width duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{ backgroundColor: "#ececec" }}
    >
      {/* Cabeçalho com logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        {!collapsed && (
          <img
            src="/images/jinjin.png"
            alt="Logo"
            className="h-8 w-auto"
          />
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <FaBars size={20} color="#1f1f1f" />
        </button>
      </div>

      {/* Itens da sidebar */}
      <nav className="mt-4 flex flex-col gap-2 flex-1">
        <SidebarItem
          collapsed={collapsed}
          icon={FaBoxes}
          label="Estoque"
          active={active === "Estoque"}
          onClick={() => onNavigate?.("Estoque")}
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
    </div>
  );
}

interface SidebarItemProps {
  collapsed: boolean;
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ collapsed, icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-all duration-300
        ${active ? "bg-black text-white rounded-lg mx-2" : "hover:bg-gray-200 text-gray-700 rounded-lg mx-2"}`}
    >
      <Icon size={20} color={active ? "#ffffff" : "#1f1f1f"} />
      <span
        className={`transition-all duration-300 ${
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
