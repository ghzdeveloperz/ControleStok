import { useState } from "react";
import { FaBoxes, FaChartBar, FaCog, FaBars } from "react-icons/fa";
import { Link } from "react-router-dom";

interface SidebarProps {
  active?: "Estoque" | "Relatórios" | "Configurações";
}

export function Sidebar({ active }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div
      className={`h-screen flex flex-col transition-width duration-300 ${
        collapsed ? "w-18" : "w-64"
      }`}
      style={{ backgroundColor: "#ececec" }}
    >
      {/* Cabeçalho com logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        {!collapsed && (
          <img
            src="src/images/jinjin.png"
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
          to="/estoque"
          active={active === "Estoque"}
        />
        <SidebarItem
          collapsed={collapsed}
          icon={FaChartBar}
          label="Relatórios"
          to="/relatorios"
          active={active === "Relatórios"}
        />
        <SidebarItem
          collapsed={collapsed}
          icon={FaCog}
          label="Configurações"
          to="/configuracoes"
          active={active === "Configurações"}
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
  to: string;
}

function SidebarItem({ collapsed, icon: Icon, label, active, to }: SidebarItemProps) {
  return (
    <Link
      to={to}
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
    </Link>
  );
}
