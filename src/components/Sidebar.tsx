// src/components/Sidebar.tsx
import { useState } from "react";
import { FaBoxes, FaChartBar, FaCog, FaBars } from "react-icons/fa";

interface SidebarProps {}

export function Sidebar(_: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div
      className={`h-screen flex flex-col transition-width duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{ backgroundColor: "#ececec" }} // fundo ligeiramente mais escuro
    >
      {/* Cabeçalho com logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        {!collapsed && (
          <img
            src="src\images\jinjin.png"   // caminho da sua imagem
            alt="Logo"
            className="h-8 w-auto" // aumentou de h-8 (32px) para h-16 (64px)
          />
        )}
        <button
          onClick={toggleCollapse}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
        >
          <FaBars size={20} color="#1f1f1f" />
        </button>
      </div>

      {/* Itens da sidebar */}
      <nav className="mt-4 flex flex-col gap-2 flex-1">
        <SidebarItem collapsed={collapsed} icon={FaBoxes} label="Estoque" />
        <SidebarItem collapsed={collapsed} icon={FaChartBar} label="Relatórios" />
        <SidebarItem collapsed={collapsed} icon={FaCog} label="Configurações" />
      </nav>
    </div>
  );
}

interface SidebarItemProps {
  collapsed: boolean;
  icon: any;
  label: string;
}

function SidebarItem({ collapsed, icon: Icon, label }: SidebarItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
      <Icon size={20} color="#1f1f1f" />
      <span
        className={`transition-all duration-300 ${
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
        }`}
        style={{ color: "#1f1f1f" }}
      >
        {label}
      </span>
    </div>
  );
}
