import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  LockKeyhole,
  Mail,
  Menu,
  ShieldCheck,
  Store,
  Truck,
  X,
} from "lucide-react";

import logo from "../assets/mystoreday_app.png";
import brandLogo from "../../assets/images/logo-and-name.png";

import heroEcosystemImage from "../../assets/images/home/ecosystem/integracao_ecossistema.png";
import merchantsSuppliersImage from "../../assets/images/home/ecosystem/merchants_and_suppliers.png";
import commerceContextImage from "../../assets/images/home/context/utilizacao_preview.png";
import dashboardImage from "../../assets/images/home/product/dashboard_principal.png";
import productsImage from "../../assets/images/home/product/tela_produtos.png";
import mobileImage from "../../assets/images/home/product/tela_mobile.png";

import { getAppLink } from "../utils/device";

const commerceHighlights = [
  "Estoque, lotes e validade",
  "Entradas, saídas e giro",
  "Alertas e estoque crítico",
  "Custos, fornecedores e relatórios",
] as const;

const supplierHighlights = [
  "Produtos e catálogo",
  "Clientes e vínculos comerciais",
  "Acompanhamento operacional",
  "Relatórios e relacionamento",
] as const;


const commerceFlowItems = [
  "Estoque em dia",
  "Validade sob controle",
  "Giro de produtos",
  "Entradas e saídas",
  "Alertas operacionais",
  "Estoque crítico",
  "Custos e relatórios",
] as const;

const supplierFlowItems = [
  "Catálogo organizado",
  "Gestão de produtos",
  "Vínculos comerciais",
  "Clientes conectados",
  "Acompanhamento operacional",
  "Relatórios claros",
  "Relacionamento com comércios",
] as const;

export default function Home() {
  const navigate = useNavigate();
  const lastScrollY = useRef(0);
  const [showHeader, setShowHeader] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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


  useEffect(() => {
    if (!showHeader) {
      setIsMobileMenuOpen(false);
    }
  }, [showHeader]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => {
      if (window.innerWidth > 720) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scrollToSolutions = () => {
    document.getElementById("solutions")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };


  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="msd-home">
      <header
        className={`msd-home-header ${
          showHeader
            ? "msd-home-header--visible"
            : "msd-home-header--hidden"
        }`}
      >
        <div className="msd-home-header__glass">
          <button
            type="button"
            className="msd-home-header__brand msd-home-header__brand--desktop"
            onClick={() => navigate("/")}
            aria-label="Ir para o início do MyStoreDay"
          >
            <img
              src={brandLogo}
              alt="MyStoreDay"
              className="msd-home-header__brand-logo"
            />
          </button>

          <button
            type="button"
            className="msd-home-header__brand msd-home-header__brand--mobile"
            onClick={() => navigate("/")}
            aria-label="Ir para o início do MyStoreDay"
          >
            <img
              src={brandLogo}
              alt="MyStoreDay"
              className="msd-home-header__brand-logo"
            />
          </button>

          <div className="msd-home-header__actions">
            <nav
              className="msd-home-header__navigation"
              aria-label="Navegação principal"
            >
              <button
                type="button"
                className="msd-home-header__nav-item"
                onClick={() => scrollToSection("solutions")}
              >
                Soluções
              </button>

              <button
                type="button"
                className="msd-home-header__nav-item"
                onClick={() => scrollToSection("commerce")}
              >
                Para Comércios
              </button>

              <button
                type="button"
                className="msd-home-header__nav-item"
                onClick={() => scrollToSection("suppliers")}
              >
                Para Fornecedores
              </button>

              <button
                type="button"
                className="msd-home-header__nav-item"
                onClick={() => scrollToSection("mobile-app")}
              >
                App mobile
              </button>
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

          <button
            type="button"
            className="msd-home-header__menu-toggle"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="msd-home-mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>

          <div
            id="msd-home-mobile-menu"
            className={`msd-home-header__mobile-menu ${
              isMobileMenuOpen
                ? "msd-home-header__mobile-menu--open"
                : ""
            }`}
          >
            <nav aria-label="Navegação mobile">
              <button
                type="button"
                onClick={() => scrollToSection("solutions")}
              >
                <span>Soluções</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("commerce")}
              >
                <span>Para Comércios</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("suppliers")}
              >
                <span>Para Fornecedores</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("mobile-app")}
              >
                <span>App mobile</span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </nav>

            <button
              type="button"
              className="msd-home-header__mobile-login"
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate("/login");
              }}
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
                Uma plataforma para conectar comércio e fornecimento, organizar
                operações e transformar dados do dia a dia em decisões mais
                claras.
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

            <div className="msd-home-hero__media">
              <img
                src={heroEcosystemImage}
                alt="Representação do ecossistema MyStoreDay conectando comércio, fornecimento, produtos e dados."
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </section>

        <section
          className="msd-home-flow-bands"
          aria-label="Fluxos do ecossistema MyStoreDay"
        >
          <div className="msd-home-flow-bands__inner">
            <div className="msd-home-flow-bands__row">
              <div
                className="msd-home-flow-bands__track msd-home-flow-bands__track--commerce"
                aria-hidden="true"
              >
                <div className="msd-home-flow-bands__group">
                  {commerceFlowItems.map((item) => (
                    <span
                      key={`commerce-a-${item}`}
                      className="msd-home-flow-bands__item"
                    >
                      <span className="msd-home-flow-bands__category">
                        <Store size={15} aria-hidden="true" />
                        <strong>Comércio</strong>
                      </span>
                      <span className="msd-home-flow-bands__label">{item}</span>
                      <span
                        className="msd-home-flow-bands__separator"
                        aria-hidden="true"
                      />
                    </span>
                  ))}
                </div>

                <div className="msd-home-flow-bands__group">
                  {commerceFlowItems.map((item) => (
                    <span
                      key={`commerce-b-${item}`}
                      className="msd-home-flow-bands__item"
                    >
                      <span className="msd-home-flow-bands__category">
                        <Store size={15} aria-hidden="true" />
                        <strong>Comércio</strong>
                      </span>
                      <span className="msd-home-flow-bands__label">{item}</span>
                      <span
                        className="msd-home-flow-bands__separator"
                        aria-hidden="true"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="msd-home-flow-bands__row">
              <div
                className="msd-home-flow-bands__track msd-home-flow-bands__track--supplier"
                aria-hidden="true"
              >
                <div className="msd-home-flow-bands__group">
                  {supplierFlowItems.map((item) => (
                    <span
                      key={`supplier-a-${item}`}
                      className="msd-home-flow-bands__item msd-home-flow-bands__item--supplier"
                    >
                      <span className="msd-home-flow-bands__label">{item}</span>
                      <span className="msd-home-flow-bands__category">
                        <Truck size={15} aria-hidden="true" />
                        <strong>Fornecedor</strong>
                      </span>
                      <span
                        className="msd-home-flow-bands__separator"
                        aria-hidden="true"
                      />
                    </span>
                  ))}
                </div>

                <div className="msd-home-flow-bands__group">
                  {supplierFlowItems.map((item) => (
                    <span
                      key={`supplier-b-${item}`}
                      className="msd-home-flow-bands__item msd-home-flow-bands__item--supplier"
                    >
                      <span className="msd-home-flow-bands__label">{item}</span>
                      <span className="msd-home-flow-bands__category">
                        <Truck size={15} aria-hidden="true" />
                        <strong>Fornecedor</strong>
                      </span>
                      <span
                        className="msd-home-flow-bands__separator"
                        aria-hidden="true"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="solutions" className="msd-home-solutions">
          <div className="msd-home-container">
            <header className="msd-home-section-intro">
              <span className="msd-home-kicker">Ecossistema MyStoreDay</span>

              <h2>
                Dois lados da operação.
                <span> Uma plataforma conectando os dois.</span>
              </h2>

              <p>
                Experiências diferentes para necessidades diferentes,
                construídas sobre o mesmo contexto operacional.
              </p>
            </header>

            <div className="msd-home-solutions__grid">
              <article id="commerce" className="msd-home-solution-card">
                <div className="msd-home-solution-card__icon">
                  <Store size={22} aria-hidden="true" />
                </div>

                <span className="msd-home-solution-card__eyebrow">
                  MyStoreDay para Comércios
                </span>

                <h3>Controle a operação sem perder o ritmo.</h3>

                <p className="msd-home-solution-card__ideal">
                  <strong>Ideal para:</strong> restaurantes, mercados,
                  lanchonetes, padarias, lojas, distribuidores locais e outros
                  negócios com rotina intensa de produtos e estoque.
                </p>

                <p>
                  Estoque, lotes, validade, giro e movimentações organizados em
                  uma visão que prioriza o que precisa de atenção agora.
                </p>

                <ul>
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
              </article>

              <article id="suppliers" className="msd-home-solution-card">
                <div className="msd-home-solution-card__icon">
                  <Truck size={22} aria-hidden="true" />
                </div>

                <span className="msd-home-solution-card__eyebrow">
                  MyStoreDay para Fornecedores
                </span>

                <h3>
                  Mais contexto para quem abastece negócios todos os dias.
                </h3>

                <p className="msd-home-solution-card__ideal">
                  <strong>Ideal para:</strong> distribuidores, atacadistas,
                  fabricantes, representantes e fornecedores que atendem
                  múltiplos comércios.
                </p>

                <p>
                  Produtos, catálogo, clientes e vínculos comerciais trabalhando
                  juntos para reduzir retrabalho e dar mais clareza à operação.
                </p>

                <ul>
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
              </article>
            </div>

            <figure className="msd-home-solutions__ecosystem">
              <img
                src={merchantsSuppliersImage}
                alt="Representação visual do MyStoreDay conectando comércios e fornecedores."
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </section>

        <section className="msd-home-real-world">
          <div className="msd-home-container msd-home-real-world__layout">
            <div className="msd-home-real-world__copy">
              <span className="msd-home-kicker">
                Feito para a rotina real
              </span>

              <h2>
                Informação útil no momento em que a operação acontece.
              </h2>

              <p>
                O MyStoreDay foi pensado para quem precisa acompanhar produtos,
                estoque, validade, movimentações e fornecedores sem transformar
                a rotina em uma sequência de controles paralelos.
              </p>

              <div className="msd-home-real-world__points">
                <div>
                  <strong>Clareza operacional</strong>
                  <span>O que exige atenção aparece primeiro.</span>
                </div>

                <div>
                  <strong>Contexto conectado</strong>
                  <span>
                    Produtos, estoque e fornecedores conversam entre si.
                  </span>
                </div>

                <div>
                  <strong>Menos retrabalho</strong>
                  <span>
                    Uma única fonte para acompanhar a operação.
                  </span>
                </div>
              </div>
            </div>

            <figure className="msd-home-real-world__media">
              <img
                src={commerceContextImage}
                alt="Equipe de comércio utilizando o MyStoreDay durante a rotina de estoque."
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </section>

        <section className="msd-home-showcase">
          <div className="msd-home-showcase__glow" aria-hidden="true" />

          <div className="msd-home-container">
            <header className="msd-home-section-intro msd-home-section-intro--light">
              <span className="msd-home-kicker">
                Produto em ação
              </span>

              <h2>Uma visão completa do que importa.</h2>

              <p>
                Estoque crítico, validade, giro, movimentações e fornecedores em
                uma interface feita para leitura rápida.
              </p>
            </header>

            <figure className="msd-home-showcase__dashboard">
              <img
                src={dashboardImage}
                alt="Dashboard principal do MyStoreDay com indicadores de estoque, validade, giro, alertas e fornecedores."
                loading="lazy"
                decoding="async"
              />
            </figure>
          </div>
        </section>

        <section className="msd-home-product-depth">
          <div className="msd-home-container">
            <header className="msd-home-section-intro">
              <span className="msd-home-kicker">
                Do resumo ao detalhe
              </span>

              <h2>
                Veja a operação inteira. Entre no detalhe quando precisar.
              </h2>

              <p>
                A visão geral ajuda a decidir onde olhar. As telas operacionais
                dão profundidade para agir com contexto.
              </p>
            </header>

            <div className="msd-home-product-depth__grid">
              <article className="msd-home-product-depth__feature">
                <div className="msd-home-product-depth__copy">
                  <span>Gestão de produtos</span>

                  <h3>
                    Produto, estoque, validade e fornecedor no mesmo contexto.
                  </h3>

                  <p>
                    Consulte informações importantes sem sair da operação e
                    acompanhe movimentações, custos e situação de cada item.
                  </p>
                </div>

                <figure className="msd-home-product-depth__desktop">
                  <img
                    src={productsImage}
                    alt="Tela de produtos do MyStoreDay com estoque, validade, fornecedor e detalhes do item."
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              </article>

              <article id="mobile-app" className="msd-home-product-depth__mobile">
                <div className="msd-home-product-depth__mobile-copy">
                  <span className="msd-home-kicker">
                    Onde você estiver
                  </span>

                  <h3>
                    O MyStoreDay também acompanha a operação no mobile.
                  </h3>

                  <p>
                    Resumo operacional, alertas e movimentações importantes para
                    consultar sem depender do computador.
                  </p>

                  <a
                    href={getAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="msd-home-primary-action"
                  >
                    <Download size={18} aria-hidden="true" />
                    Conhecer aplicativo
                  </a>
                </div>

                <figure>
                  <img
                    src={mobileImage}
                    alt="Aplicativo mobile do MyStoreDay exibindo resumo operacional, alertas e movimentações."
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              </article>
            </div>
          </div>
        </section>

        <section className="msd-home-philosophy">
          <div className="msd-home-container">
            <header className="msd-home-section-intro">
              <span className="msd-home-kicker">
                Como pensamos o produto
              </span>

              <h2>Clareza antes de complexidade.</h2>

              <p>
                Software operacional deve tornar a rotina mais legível, não
                adicionar mais uma camada de ruído.
              </p>
            </header>

            <div className="msd-home-philosophy__statements">
              <article>
                <span>01</span>

                <h3>Informação conectada por natureza.</h3>

                <p>
                  Produtos, estoque, movimentações e fornecedores fazem parte da
                  mesma operação.
                </p>
              </article>

              <article>
                <span>02</span>

                <h3>Prevenção antes do problema.</h3>

                <p>
                  Alertas ajudam a identificar rupturas, vencimentos e pontos
                  críticos antes que virem perda.
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
              <span className="msd-home-kicker">
                Comece pelo seu contexto
              </span>

              <h2>
                Qual experiência faz sentido para sua operação?
              </h2>
            </div>

            <div className="msd-home-choice__links">
              <button
                type="button"
                onClick={() => navigate("/login")}
              >
                <span>
                  <Store size={21} aria-hidden="true" />
                  <strong>Tenho um comércio</strong>
                </span>

                <ArrowRight size={20} aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
              >
                <span>
                  <Truck size={21} aria-hidden="true" />
                  <strong>Sou fornecedor</strong>
                </span>

                <ArrowRight size={20} aria-hidden="true" />
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
                <Download size={16} aria-hidden="true" />
                Aplicativo mobile
              </a>
            </div>

            <nav
              className="msd-home-footer__column"
              aria-label="Produtos"
            >
              <strong>Produtos</strong>

              <button
                type="button"
                onClick={scrollToSolutions}
              >
                Para Comércios
              </button>

              <button
                type="button"
                onClick={scrollToSolutions}
              >
                Para Fornecedores
              </button>

              <a
                href={getAppLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                Aplicativo mobile
              </a>
            </nav>

            <nav
              className="msd-home-footer__column"
              aria-label="Suporte"
            >
              <strong>Suporte</strong>

              <Link to="/help">
                Central de ajuda
              </Link>

              <Link to="/contact">
                <Mail size={14} aria-hidden="true" />
                Contato
              </Link>
            </nav>

            <nav
              className="msd-home-footer__column"
              aria-label="Legal"
            >
              <strong>Legal</strong>

              <Link to="/politics-privacy">
                Política de Privacidade
              </Link>

              <Link to="/terms-of-use">
                Termos de Uso
              </Link>

              <span className="msd-home-footer__security">
                <LockKeyhole size={14} aria-hidden="true" />
                Ambiente protegido
              </span>
            </nav>
          </div>

          <div className="msd-home-footer__bottom">
            <span>
              © {new Date().getFullYear()} MyStoreDay. Todos os direitos
              reservados.
            </span>

            <span className="msd-home-footer__secure">
              <ShieldCheck size={14} aria-hidden="true" />
              Segurança desde a arquitetura
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
