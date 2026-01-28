// src/pages/Home.tsx
import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Bell,
  History,
  BarChart3,
  ArrowRight,
  Download,
  HelpCircle,
  Shield,
  FileText,
  Mail,
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
  ChevronDown,
} from "lucide-react"

import logo from "../assets/mystoreday_app.png"
import { getAppLink } from "../utils/device"

export default function Home() {
  const navigate = useNavigate()
  const lastScrollY = useRef(0)
  const [showHeader, setShowHeader] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleScroll = () => {
      const current = window.scrollY

      if (current > lastScrollY.current && current > 80) setShowHeader(false)
      else setShowHeader(true)

      lastScrollY.current = current
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
      {/* HEADER FIXO NO TOPO */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-in-out ${showHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          }`}
      >
        <div className="backdrop-blur-lg bg-white/90 border-b border-zinc-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => navigate("/")}>
              <img src={logo} alt="MyStoreDay" className="h-7 md:h-10 lg:h-12 object-contain transition-all duration-300" />
              <span className="font-semibold text-zinc-900 text-base sm:text-lg">MyStoreDay</span>
            </div>

            {/* LINKS + CTA */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* ✅ Para humanos: TSX bonitinho */}
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  to="/politics-privacy"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                >
                  Política de Privacidade
                </Link>

                <Link
                  to="/terms-of-use"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                >
                  Termos de Uso
                </Link>
              </nav>

              <button
                onClick={() => navigate("/login")}
                className="px-4 sm:px-5 py-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-md transition-all duration-200 flex items-center gap-2 font-medium cursor-pointer text-sm sm:text-base"
              >
                Acessar sistema
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 pt-20 sm:pt-32">
        {/* HERO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-32">
          <div className="text-center md:text-left relative">
            <div className="absolute inset-0 -z-10 opacity-10">
              <div className="w-full h-full bg-linear-to-br from-zinc-200 to-zinc-300 rounded-3xl flex items-center justify-center">
                <div className="text-zinc-400 text-6xl sm:text-9xl">📦</div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-4xl bg-linear-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent animate-fade-in">
              Estoque sob controle,
              <span className="block text-zinc-500 mt-4 text-xl sm:text-3xl md:text-4xl lg:text-5xl font-medium">
                sem ruído, sem retrabalho.
              </span>
            </h1>

            <p className="mt-6 sm:mt-8 text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed mx-auto md:mx-0">
              O MyStoreDay foi criado para operações reais: controle claro, alertas precisos e decisões melhores.
              Gerencie seu inventário com eficiência, reduza perdas e aumente a produtividade da sua equipe.
            </p>

            <div className="mt-8 sm:mt-12 flex flex-row gap-4 justify-center md:justify-start flex-wrap">
              <button
                onClick={() => navigate("/login")}
                className="px-8 py-4 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium cursor-pointer text-base min-w-[200px] justify-center"
              >
                Iniciar agora
                <ArrowRight className="w-5 h-5" />
              </button>

              <a
                href={getAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border-2 border-zinc-300 hover:bg-zinc-100 hover:border-zinc-400 transition-all duration-200 flex items-center gap-2 font-medium text-base min-w-[200px] justify-center"
              >
                <Download className="w-5 h-5" />
                Baixar app
              </a>
            </div>
          </div>
        </section>

        {/* FUNCIONALIDADES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-32 bg-zinc-100/50 rounded-3xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">
              Funcionalidades que fazem a diferença
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              Descubra como o MyStoreDay simplifica o gerenciamento de estoque com ferramentas inteligentes e intuitivas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <Feature icon={<Bell className="w-6 sm:w-8 h-6 sm:h-8 text-zinc-900" />} title="Alertas inteligentes">
              Receba notificações automáticas antes que o estoque acabe, evitando rupturas e perdas.
              <ul className="mt-3 space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Configuração personalizada de limites
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Notificações via email e app
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Prevenção de overstock
                </li>
              </ul>
            </Feature>

            <Feature icon={<History className="w-6 sm:w-8 h-6 sm:h-8 text-zinc-900" />} title="Histórico claro">
              Acompanhe cada movimentação registrada em tempo real, com relatórios detalhados e fáceis de consultar.
              <ul className="mt-3 space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Rastreamento de entradas e saídas
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Filtros avançados por data e produto
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Exportação para PDF/Excel
                </li>
              </ul>
            </Feature>

            <Feature icon={<BarChart3 className="w-6 sm:w-8 h-6 sm:h-8 text-zinc-900" />} title="Relatórios objetivos">
              Tome decisões baseadas em dados precisos, com gráficos e métricas que eliminam suposições.
              <ul className="mt-3 space-y-1 text-xs">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Dashboards interativos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Análises de tendências
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
                  Métricas de performance
                </li>
              </ul>
            </Feature>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-32">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">
              Por que escolher o MyStoreDay?
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              Veja os benefícios que tornam nossa plataforma a escolha ideal para seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <Benefit icon={<Zap className="w-8 sm:w-10 h-8 sm:h-10 text-zinc-900" />} title="Rápido e Intuitivo" description="Interface simples para começar em minutos, sem treinamentos complexos." />
            <Benefit icon={<TrendingUp className="w-8 sm:w-10 h-8 sm:h-10 text-zinc-900" />} title="Aumente a Produtividade" description="Automatize tarefas repetitivas e foque no que realmente importa." />
            <Benefit icon={<Users className="w-8 sm:w-10 h-8 sm:h-10 text-zinc-900" />} title="Suporte 24/7" description="Equipe dedicada para ajudar com dúvidas e personalizações." />
            <Benefit icon={<Shield className="w-8 sm:w-10 h-8 sm:h-10 text-zinc-900" />} title="Seguro e Confiável" description="Dados protegidos com criptografia e backups automáticos." />
          </div>
        </section>

        {/* ESTATÍSTICAS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-32 bg-linear-to-r from-zinc-100 to-zinc-200 rounded-3xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">
              Números que falam por si
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              Veja o impacto do MyStoreDay em milhares de negócios ao redor do mundo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center">
            <Stat number="10.000+" label="Usuários Ativos" />
            <Stat number="500.000+" label="Produtos Gerenciados" />
            <Stat number="95%" label="Satisfação dos Clientes" />
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-32">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-zinc-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              Tire suas dúvidas sobre o MyStoreDay de forma rápida e direta.
            </p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            <FAQ question="Como começar a usar o MyStoreDay?" answer="Basta se cadastrar gratuitamente, importar seus produtos e configurar alertas. Nosso assistente guiará você passo a passo." />
            <FAQ question="É seguro armazenar meus dados na plataforma?" answer="Sim, utilizamos criptografia de ponta e servidores seguros. Seus dados são protegidos conforme as melhores práticas de privacidade." />
            <FAQ question="Há limite de produtos ou usuários?" answer="Nosso plano básico suporta até 1.000 produtos e 5 usuários. Planos premium oferecem limites maiores." />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-3 text-sm text-zinc-600">
          {/* MARCA */}
          <div className="space-y-4">
            <div className="flex items-center gap-1 font-semibold text-zinc-900 text-base">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
              MyStoreDay
            </div>

            <p className="leading-relaxed max-w-sm text-sm sm:text-base">
              Plataforma moderna para controle de estoque, alertas inteligentes e decisões baseadas em dados reais.
              Junte-se a milhares de empresas que confiam no MyStoreDay para otimizar suas operações.
            </p>

            <span className="text-xs text-zinc-400">
              © {new Date().getFullYear()} MyStoreDay. Todos os direitos reservados.
            </span>
          </div>

          {/* NAVEGAÇÃO */}
          <div className="space-y-3">
            <h4 className="font-medium text-zinc-900">Produto</h4>

            <ul className="space-y-2">
              <li className="hover:text-zinc-800 cursor-pointer transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 className="w-4 h-4" />
                Funcionalidades
              </li>
              <li className="hover:text-zinc-800 cursor-pointer transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                <History className="w-4 h-4" />
                Relatórios
              </li>
              <li className="hover:text-zinc-800 cursor-pointer transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                <Bell className="w-4 h-4" />
                Alertas de estoque
              </li>
              <li className="hover:text-zinc-800 cursor-pointer transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                <Download className="w-4 h-4" />
                Aplicativo mobile (em breve)
              </li>
            </ul>
          </div>

          {/* SUPORTE & LEGAL */}
          <div className="space-y-3">
            <h4 className="font-medium text-zinc-900">Suporte & Legal</h4>

            <ul className="space-y-2">
              <li className="hover:text-zinc-800 transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                <HelpCircle className="w-4 h-4" />
                <Link to="/help" className="inline-block">Central de ajuda</Link>
              </li>

              {/* ✅ humano (tsx) */}
              <li className="hover:text-zinc-800 transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                <Shield className="w-4 h-4" />
                <Link to="/politics-privacy" className="inline-block hover:underline underline-offset-4">
                  Política de Privacidade
                </Link>
              </li>

              {/* ✅ humano (tsx) */}
              <li className="hover:text-zinc-800 transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                <FileText className="w-4 h-4" />
                <Link to="/terms-of-use" className="inline-block hover:underline underline-offset-4">
                  Termos de Uso
                </Link>
              </li>

              <li className="hover:text-zinc-800 transition-colors duration-200 flex items-center gap-2 text-sm sm:text-base">
                <Mail className="w-4 h-4" />
                <Link to="/contact" className="inline-block">Contato</Link>
              </li>

              {/* ✅ google (html estático) — discreto mas rastreável */}
              <li className="pt-3 text-xs text-zinc-400 leading-relaxed">
                Versões estáticas (verificação):
                <a href="/politics-privacy.html" className="ml-2 underline underline-offset-4 hover:text-zinc-600">
                  Privacidade
                </a>
                <a href="/terms-of-use.html" className="ml-2 underline underline-offset-4 hover:text-zinc-600">
                  Termos
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 hover:shadow-xl hover:border-zinc-300 hover:scale-105 transition-all duration-300 group cursor-pointer">
      <div className="mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="font-semibold text-lg mb-3 text-zinc-900">{title}</h3>
      <div className="text-sm text-zinc-600 leading-relaxed">{children}</div>
    </div>
  )
}

function Benefit({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center p-4 sm:p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer">
      <div className="mb-4 flex justify-center">{icon}</div>
      <h3 className="font-semibold text-lg mb-2 text-zinc-900">{title}</h3>
      <p className="text-sm text-zinc-600">{description}</p>
    </div>
  )
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer">
      <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 mb-2">{number}</div>
      <div className="text-sm text-zinc-600 uppercase tracking-wide">{label}</div>
    </div>
  )
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-zinc-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 sm:px-6 py-4 text-left flex items-center justify-between hover:bg-zinc-50 transition-colors duration-200 cursor-pointer"
      >
        <span className="font-medium text-zinc-900 text-sm sm:text-base">{question}</span>
        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="px-4 sm:px-6 pb-4 text-sm text-zinc-600 leading-relaxed">{answer}</div>}
    </div>
  )
}
