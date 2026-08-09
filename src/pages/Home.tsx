import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Download,
  History,
  LockKeyhole,
  Mail,
  PackageCheck,
  PackageX,
  RefreshCw,
  Store,
  Truck,
  UsersRound,
} from "lucide-react";

import logo from "../assets/mystoreday_app.png";
import { getAppLink } from "../utils/device";

const commerceHighlights = [
  "Estoque e disponibilidade",
  "Lotes e validade",
  "Giro e movimentações",
  "Custos, alertas e relatórios",
] as const;

const supplierHighlights = [
  "Produtos e catálogo",
  "Clientes e vínculos",
  "Relacionamento com comércios",
  "Acompanhamento e relatórios",
] as const;

const connectedItems = [
  { icon: Boxes, label: "Produtos" },
  { icon: PackageCheck, label: "Estoque" },
  { icon: RefreshCw, label: "Movimentações" },
  { icon: Truck, label: "Fornecedores" },
  { icon: BarChart3, label: "Métricas" },
] as const;

export default function Home() {
  const navigate = useNavigate();
  const lastScrollY = useRef(0);
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSolutions = () => {
    document.getElementById("solutions")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="msd-home">
      <header
        className={`msd-home-header ${showHeader
          ? "msd-home-header--visible"
          : "msd-home-header--hidden"
          }`}
      >
        <div className="msd-home-header__glass">
          <button
            type="button"
            className="msd-home-header__brand"
            onClick={() => navigate("/")}
            aria-label="Ir para o início do MyStoreDay"
          >
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              className="msd-home-header__brand-image"
            />
            <span>MyStoreDay</span>
          </button>

          <div className="msd-home-header__actions">
            <nav
              className="msd-home-header__navigation"
              aria-label="Navegação principal"
            >
              <Link to="/politics-privacy" className="msd-home-header__link">
                Política de Privacidade
              </Link>
              <Link to="/terms-of-use" className="msd-home-header__link">
                Termos de Uso
              </Link>
            </nav>

            <button
              type="button"
              className="msd-home-header__cta"
              onClick={() => navigate("/login")}
            >
              Acessar sistema
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="msd-home-hero">
          <div className="msd-home-hero__ambient" aria-hidden="true" />

          <div className="msd-home-container msd-home-hero__content">
            <div className="msd-home-hero__copy">

              <h1 className="msd-home-hero__title">
                <span className="msd-home-hero__title-primary">
                  Tecnologia para o seu negócio
                </span>

                <span className="msd-home-hero__title-secondary">
                  funcionar melhor todos os dias.
                </span>
              </h1>

              <p>
                Uma plataforma criada para conectar comércio e fornecimento em
                torno daquilo que realmente move a operação: produtos, estoque,
                movimentações, relacionamento e informação.
              </p>

              <div className="msd-home-hero__actions">
                <button
                  type="button"
                  className="msd-home-primary-action"
                  onClick={scrollToSolutions}
                >
                  Conhecer soluções
                  <ArrowRight size={18} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="msd-home-secondary-action"
                  onClick={() => navigate("/login")}
                >
                  Acessar sistema
                </button>
              </div>
            </div>

            <div className="msd-home-hero__visual" aria-hidden="true">
              <div className="msd-home-hero__halo msd-home-hero__halo--one" />
              <div className="msd-home-hero__halo msd-home-hero__halo--two" />

              <div className="msd-home-hero__brand-orb">
                <img src={logo} alt="" />
                <strong>MyStoreDay</strong>
                <span>Operações conectadas</span>
              </div>

              <div className="msd-home-hero__floating-label msd-home-hero__floating-label--commerce">
                <Store size={17} />
                <span>Comércios</span>
              </div>

              <div className="msd-home-hero__floating-label msd-home-hero__floating-label--supplier">
                <Truck size={17} />
                <span>Fornecedores</span>
              </div>

              <span className="msd-home-hero__signal msd-home-hero__signal--stock">
                Estoque
              </span>
              <span className="msd-home-hero__signal msd-home-hero__signal--data">
                Métricas
              </span>
            </div>
          </div>
        </section>

        <section id="solutions" className="msd-home-product-stories">
          <div className="msd-home-container">
            <header className="msd-home-section-intro">
              <span className="msd-home-kicker">Soluções MyStoreDay</span>
              <h2>Duas operações. Uma mesma lógica de organização.</h2>
              <p>
                Cada experiência foi desenhada para o contexto de quem usa, sem
                transformar o produto em um amontoado de recursos.
              </p>
            </header>

            <article className="msd-home-story msd-home-story--commerce">
              <div className="msd-home-story__copy">
                <span className="msd-home-story__eyebrow">
                  MyStoreDay para Comércios
                </span>

                <h3>Controle a operação sem perder o ritmo.</h3>

                <p className="msd-home-story__ideal">
                  <strong>Ideal para:</strong> restaurantes, mercados,
                  lanchonetes, padarias, lojas, distribuidores locais e outros
                  negócios com rotina intensa de produtos e estoque.
                </p>

                <p className="msd-home-story__description">
                  Acompanhe estoque, lotes, validade, giro e movimentações em
                  uma visão que prioriza o que precisa de atenção agora e reduz
                  a dependência de controles espalhados.
                </p>

                <ul className="msd-home-story__highlights">
                  {commerceHighlights.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="msd-home-text-action"
                  onClick={() => navigate("/login")}
                >
                  Explorar para Comércios
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>

              <div className="msd-home-story__visual" aria-hidden="true">
                <div className="msd-home-story__device">
                  <div className="msd-home-story__device-topbar">
                    <div>
                      <span />
                      <span />
                      <span />
                    </div>
                    <strong>Resumo da operação</strong>
                  </div>

                  <div className="msd-home-story__metrics">
                    <div>
                      <small>Estoque crítico</small>
                      <strong>7</strong>
                    </div>
                    <div>
                      <small>Perto da validade</small>
                      <strong>12</strong>
                    </div>
                    <div>
                      <small>Giro médio</small>
                      <strong>2,45</strong>
                    </div>
                  </div>

                  <div className="msd-home-story__graph">
                    <span className="msd-home-story__graph-line msd-home-story__graph-line--one" />
                    <span className="msd-home-story__graph-line msd-home-story__graph-line--two" />
                    <span className="msd-home-story__graph-line msd-home-story__graph-line--three" />
                    <span className="msd-home-story__graph-line msd-home-story__graph-line--four" />
                    <span className="msd-home-story__graph-line msd-home-story__graph-line--five" />
                    <svg viewBox="0 0 520 170" preserveAspectRatio="none">
                      <path
                        d="M0 145 C48 138 65 104 108 112 C152 120 166 74 213 82 C257 91 278 54 323 65 C371 76 390 99 431 83 C465 71 490 63 520 49"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </article>

            <article className="msd-home-story msd-home-story--supplier">
              <div className="msd-home-story__visual" aria-hidden="true">
                <div className="msd-home-story__supply-network">
                  <div className="msd-home-story__supply-center">
                    <Truck size={26} />
                    <strong>Fornecedor</strong>
                    <span>Operação central</span>
                  </div>

                  <div className="msd-home-story__supply-node msd-home-home-node--one">
                    <Store size={17} />
                    <span>Comércio A</span>
                  </div>
                  <div className="msd-home-story__supply-node msd-home-home-node--two">
                    <Store size={17} />
                    <span>Comércio B</span>
                  </div>
                  <div className="msd-home-story__supply-node msd-home-home-node--three">
                    <Store size={17} />
                    <span>Comércio C</span>
                  </div>
                  <div className="msd-home-story__supply-node msd-home-home-node--four">
                    <Boxes size={17} />
                    <span>Catálogo</span>
                  </div>
                </div>
              </div>

              <div className="msd-home-story__copy">
                <span className="msd-home-story__eyebrow">
                  MyStoreDay para Fornecedores
                </span>

                <h3>Mais contexto para quem abastece negócios todos os dias.</h3>

                <p className="msd-home-story__ideal">
                  <strong>Ideal para:</strong> distribuidores, atacadistas,
                  fabricantes, representantes, fornecedores regionais e
                  empresas que atendem múltiplos comércios.
                </p>

                <p className="msd-home-story__description">
                  Organize produtos, catálogo, clientes e vínculos comerciais
                  em uma operação conectada, com menos retrabalho e mais clareza
                  sobre cada relacionamento.
                </p>

                <ul className="msd-home-story__highlights">
                  {supplierHighlights.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="msd-home-text-action"
                  onClick={() => navigate("/login")}
                >
                  Explorar para Fornecedores
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="msd-home-connected">
          <div className="msd-home-connected__grid" aria-hidden="true" />

          <div className="msd-home-container msd-home-connected__content">
            <header className="msd-home-section-intro msd-home-section-intro--left">
              <span className="msd-home-kicker">Ecossistema conectado</span>
              <h2>Informação que circula com a operação.</h2>
              <p>
                O valor não está em ter mais telas. Está em fazer com que
                produtos, estoque, movimentações e fornecedores compartilhem o
                mesmo contexto.
              </p>
            </header>

            <div className="msd-home-connected__canvas" aria-hidden="true">
              <div className="msd-home-connected__orbit msd-home-connected__orbit--outer" />
              <div className="msd-home-connected__orbit msd-home-connected__orbit--inner" />

              <div className="msd-home-connected__core">
                <img src={logo} alt="" />
                <strong>MyStoreDay</strong>
                <span>Contexto operacional</span>
              </div>

              {connectedItems.map(({ icon: Icon, label }, index) => (
                <div
                  key={label}
                  className={`msd-home-connected__item msd-home-connected__item--${index + 1
                    }`}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="msd-home-showcase">
          <div className="msd-home-showcase__glow" aria-hidden="true" />

          <div className="msd-home-container">
            <header className="msd-home-section-intro msd-home-section-intro--light">
              <span className="msd-home-kicker">Produto em ação</span>
              <h2>Sua operação em uma única visão.</h2>
              <p>
                Um painel que organiza o essencial sem competir pela sua
                atenção.
              </p>
            </header>

            <div className="msd-home-dashboard">
              <aside className="msd-home-dashboard__sidebar">
                <div className="msd-home-dashboard__brand">
                  <img src={logo} alt="" />
                  <span>MyStoreDay</span>
                </div>

                <div className="msd-home-dashboard__navigation">
                  <span className="msd-home-dashboard__navigation-item msd-home-dashboard__navigation-item--active">
                    <BarChart3 size={15} />
                    Resumo
                  </span>
                  <span className="msd-home-dashboard__navigation-item">
                    <Boxes size={15} />
                    Produtos
                  </span>
                  <span className="msd-home-dashboard__navigation-item">
                    <PackageCheck size={15} />
                    Estoque
                  </span>
                  <span className="msd-home-dashboard__navigation-item">
                    <History size={15} />
                    Movimentações
                  </span>
                  <span className="msd-home-dashboard__navigation-item">
                    <Truck size={15} />
                    Fornecedores
                  </span>
                  <span className="msd-home-dashboard__navigation-item">
                    <UsersRound size={15} />
                    Membros
                  </span>
                </div>
              </aside>

              <div className="msd-home-dashboard__content">
                <header className="msd-home-dashboard__header">
                  <div>
                    <strong>Resumo geral</strong>
                    <span>Visão consolidada da operação</span>
                  </div>

                  <span className="msd-home-dashboard__period">
                    <CalendarClock size={14} />
                    Últimos 30 dias
                  </span>
                </header>

                <div className="msd-home-dashboard__metrics">
                  <DashboardMetric
                    label="Estoque crítico"
                    value="7"
                    icon={PackageX}
                    tone="danger"
                  />
                  <DashboardMetric
                    label="Perto da validade"
                    value="12"
                    icon={CalendarClock}
                    tone="warning"
                  />
                  <DashboardMetric
                    label="Giro médio"
                    value="2,45"
                    icon={RefreshCw}
                    tone="primary"
                  />
                  <DashboardMetric
                    label="Valor em estoque"
                    value="R$ 87.650"
                    icon={CircleDollarSign}
                    tone="neutral"
                  />
                </div>

                <div className="msd-home-dashboard__grid">
                  <article className="msd-home-dashboard-panel msd-home-dashboard-panel--chart">
                    <header>
                      <div>
                        <strong>Movimentação de estoque</strong>
                        <span>Entradas e saídas</span>
                      </div>
                      <strong className="msd-home-dashboard-panel__positive">
                        +12,4%
                      </strong>
                    </header>

                    <div className="msd-home-dashboard-chart">
                      <div className="msd-home-dashboard-chart__lines" />
                      <svg viewBox="0 0 620 220" preserveAspectRatio="none">
                        <defs>
                          <linearGradient
                            id="msd-home-dashboard-fill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#5567c7"
                              stopOpacity="0.24"
                            />
                            <stop
                              offset="100%"
                              stopColor="#5567c7"
                              stopOpacity="0"
                            />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0 184 C48 176 62 132 110 143 C158 153 171 104 220 113 C269 121 287 72 337 87 C389 102 407 126 451 105 C499 84 532 88 620 58 L620 220 L0 220 Z"
                          fill="url(#msd-home-dashboard-fill)"
                        />
                        <path
                          d="M0 184 C48 176 62 132 110 143 C158 153 171 104 220 113 C269 121 287 72 337 87 C389 102 407 126 451 105 C499 84 532 88 620 58"
                          fill="none"
                          stroke="#5567c7"
                          strokeWidth="3"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    </div>
                  </article>

                  <article className="msd-home-dashboard-panel">
                    <header>
                      <div>
                        <strong>Próximos da validade</strong>
                        <span>Requerem atenção</span>
                      </div>
                    </header>

                    <div className="msd-home-dashboard-list">
                      <div>
                        <span>Leite integral</span>
                        <strong className="msd-home-dashboard-pill msd-home-dashboard-pill--danger">
                          5 dias
                        </strong>
                      </div>
                      <div>
                        <span>Iogurte natural</span>
                        <strong className="msd-home-dashboard-pill msd-home-dashboard-pill--warning">
                          7 dias
                        </strong>
                      </div>
                      <div>
                        <span>Queijo muçarela</span>
                        <strong className="msd-home-dashboard-pill msd-home-dashboard-pill--attention">
                          10 dias
                        </strong>
                      </div>
                      <div>
                        <span>Creme de leite</span>
                        <strong className="msd-home-dashboard-pill msd-home-dashboard-pill--neutral">
                          13 dias
                        </strong>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
            </div>

            <span className="msd-home-showcase__caption">
              Interface ilustrativa do ecossistema MyStoreDay.
            </span>
          </div>
        </section>

        <section className="msd-home-philosophy">
          <div className="msd-home-container">
            <header className="msd-home-section-intro">
              <span className="msd-home-kicker">Como pensamos o produto</span>
              <h2>Menos ruído. Mais contexto.</h2>
            </header>

            <div className="msd-home-philosophy__statements">
              <article>
                <span>01</span>
                <h3>Clareza antes de complexidade.</h3>
                <p>
                  O que precisa de atenção aparece primeiro. O resto permanece
                  acessível sem disputar espaço.
                </p>
              </article>

              <article>
                <span>02</span>
                <h3>Informação conectada por natureza.</h3>
                <p>
                  Produtos, estoque, movimentações e fornecedores fazem parte da
                  mesma operação, não de silos diferentes.
                </p>
              </article>

              <article>
                <span>03</span>
                <h3>Segurança faz parte do produto.</h3>
                <p>
                  Acesso, permissões e regras críticas são tratados além da
                  interface e validados pela plataforma.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="msd-home-choice">
          <div className="msd-home-container">
            <div className="msd-home-choice__intro">
              <span className="msd-home-kicker">Comece pelo seu contexto</span>
              <h2>Escolha sua operação.</h2>
            </div>

            <div className="msd-home-choice__links">
              <button type="button" onClick={() => navigate("/login")}>
                <span>
                  <Store size={21} />
                  <strong>Tenho um comércio</strong>
                </span>
                <ArrowRight size={20} />
              </button>

              <button type="button" onClick={() => navigate("/login")}>
                <span>
                  <Truck size={21} />
                  <strong>Sou fornecedor</strong>
                </span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="msd-home-footer">
        <div className="msd-home-container">
          <div className="msd-home-footer__main">
            <div className="msd-home-footer__brand">
              <div>
                <img src={logo} alt="" />
                <strong>MyStoreDay</strong>
              </div>

              <p>
                Tecnologia para tornar operações mais organizadas, conectadas e
                previsíveis.
              </p>

              <a
                href={getAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="msd-home-footer__download"
              >
                <Download size={16} />
                Aplicativo mobile
              </a>
            </div>

            <nav className="msd-home-footer__column" aria-label="Produtos">
              <strong>Produtos</strong>
              <button type="button" onClick={scrollToSolutions}>
                Para Comércios
              </button>
              <button type="button" onClick={scrollToSolutions}>
                Para Fornecedores
              </button>
              <a href={getAppLink()} target="_blank" rel="noopener noreferrer">
                Aplicativo mobile
              </a>
            </nav>

            <nav className="msd-home-footer__column" aria-label="Suporte">
              <strong>Suporte</strong>
              <Link to="/help">Central de ajuda</Link>
              <Link to="/contact">
                <Mail size={14} />
                Contato
              </Link>
            </nav>

            <nav className="msd-home-footer__column" aria-label="Legal">
              <strong>Legal</strong>
              <Link to="/politics-privacy">Política de Privacidade</Link>
              <Link to="/terms-of-use">Termos de Uso</Link>
              <span className="msd-home-footer__security">
                <LockKeyhole size={14} />
                Ambiente protegido
              </span>
            </nav>
          </div>

          <div className="msd-home-footer__bottom">
            <span>
              © {new Date().getFullYear()} MyStoreDay. Todos os direitos
              reservados.
            </span>
            <span>MyStoreDay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface DashboardMetricProps {
  readonly label: string;
  readonly value: string;
  readonly icon: typeof PackageX;
  readonly tone: "danger" | "warning" | "primary" | "neutral";
}

function DashboardMetric({
  label,
  value,
  icon: Icon,
  tone,
}: DashboardMetricProps) {
  return (
    <article className="msd-home-dashboard-metric">
      <span
        className={`msd-home-dashboard-metric__icon msd-home-dashboard-metric__icon--${tone}`}
      >
        <Icon size={17} aria-hidden="true" />
      </span>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
