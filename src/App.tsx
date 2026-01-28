import React, { useState, useEffect } from "react"
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom"

import { Sidebar } from "./components/Sidebar"

import Home from "./pages/Home"
import Estoque from "./pages/Estoque"
import Relatorios from "./pages/Relatorios"
import { Configuracoes } from "./pages/Configuracoes"
import { NovoProduto } from "./pages/NovoProduto"
import { Alertas } from "./pages/Alertas"
import { Login } from "./pages/Login"

import PrivacyPolicy from "./pages/PrivacyPolicy"
import TermsOfUse from "./pages/TermsOfUse"

import { LoadingProvider } from "./contexts/LoadingContext"
import { useProducts } from "./hooks/useProducts"

import { FaBoxes, FaPlus, FaChartBar, FaExclamationTriangle, FaCog } from "react-icons/fa"

// =================== APP (ROOT) ===================
export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!localStorage.getItem("loggedInUser"))

  const [loggedUser, setLoggedUser] = useState<string>(
    localStorage.getItem("loggedInUser") ?? "usuário"
  )

  const handleLoginSuccess = (login: string) => {
    localStorage.setItem("loggedInUser", login)
    setLoggedUser(login)
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser")
    setLoggedUser("usuário")
    setIsLoggedIn(false)
  }

  return (
    <LoadingProvider>
      <Routes>
        {!isLoggedIn && (
          <>
            <Route path="/" element={<Home />} />

            {/* ✅ ROTAS LEGAIS (DESLOGADO) */}
            <Route path="/politics-privacy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-use" element={<TermsOfUse />} />

            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />

            {/* ✅ mantém fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {isLoggedIn && (
          <Route
            path="/*"
            element={<AppContent loggedUser={loggedUser} onLogout={handleLogout} />}
          />
        )}
      </Routes>
    </LoadingProvider>
  )
}

// =================== APP INTERNO ===================
const AppContent: React.FC<{
  onLogout: () => void
  loggedUser: string
}> = ({ onLogout, loggedUser }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const [sidebarWidth, setSidebarWidth] = useState(260)

  const [logoSrc, setLogoSrc] = useState(
    localStorage.getItem("appLogo") ?? "/images/jinjin-banner.png"
  )

  const storedProfile = localStorage.getItem("profileImage")
  const [profileSrc, setProfileSrc] = useState(
    storedProfile ? `${storedProfile}?t=${Date.now()}` : "/images/profile-200.jpg"
  )

  const userID = loggedUser

  const { products, loading } = useProducts(userID)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [zeroStockCount, setZeroStockCount] = useState(0)

  useEffect(() => {
    if (loading) return

    let low = 0
    let zero = 0

    products.forEach((p) => {
      const qty = Number(p.quantity ?? 0)
      const min = Number(p.minStock ?? 10)

      if (qty === 0) zero++
      else if (qty > 0 && qty <= min) low++
    })

    setLowStockCount(low)
    setZeroStockCount(zero)
  }, [products, loading])

  return (
    <div className="flex w-full min-h-screen overflow-x-hidden">
      {/* SIDEBAR */}
      <Sidebar
        width={sidebarWidth}
        setWidth={setSidebarWidth}
        logoSrc={logoSrc}
        profileSrc={profileSrc}
        userId={userID}
        lowStockCount={lowStockCount}
        zeroStockCount={zeroStockCount}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex flex-col flex-1 bg-gray-50">
        {/* ÁREA SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/estoque" replace />} />

            <Route path="/estoque" element={<Estoque userId={userID} />} />
            <Route path="/estoque/novoproduto" element={<NovoProduto userId={userID} />} />

            <Route path="/relatorios" element={<Relatorios userId={userID} />} />
            <Route path="/alertas" element={<Alertas userId={userID} />} />

            <Route
              path="/configuracoes"
              element={
                <Configuracoes
                  userId={userID}
                  onLogoChange={(newLogo) => {
                    setLogoSrc(newLogo)
                    localStorage.setItem("appLogo", newLogo)
                  }}
                  onProfileChange={(newProfile) => {
                    const updated = `${newProfile}?t=${Date.now()}`
                    setProfileSrc(updated)
                    localStorage.setItem("profileImage", newProfile)
                  }}
                  onLogout={onLogout}
                />
              }
            />

            <Route path="*" element={<Navigate to="/estoque" replace />} />
          </Routes>
        </div>

        {/* FOOTER MOBILE */}
        <div className="md:hidden w-full bg-white border-t border-gray-300 flex justify-around items-center py-3 shadow-lg">
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
  )
}

// =================== MOBILE ITEM ===================
function MobileItem({
  icon,
  label,
  active,
  onClick,
  low = 0,
  zero = 0,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
  low?: number
  zero?: number
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center px-3 py-1.5 rounded-xl transition-all ${
        active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-200"
      }`}
    >
      <div className="relative">
        {icon}
        <div className="absolute -top-1 -right-2 flex gap-0.5">
          {low > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {low}
            </span>
          )}
          {zero > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {zero}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  )
}
