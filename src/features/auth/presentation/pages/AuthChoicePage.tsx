import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Boxes, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppBrand } from "../../../../design_system/components/AppBrand";
import { AppButton } from "../../../../design_system/components/AppButton";
import { routePaths } from "../../../../app/router/route-paths";

const slides = [
  {
    icon: Boxes,
    title: "Controle seu estoque com clareza.",
    description:
      "Produtos, quantidades e alertas organizados em uma experiência consistente no Web e no mobile.",
  },
  {
    icon: BarChart3,
    title: "Decisões baseadas em dados reais.",
    description:
      "Acompanhe movimentações, custos e indicadores da sua operação sem perder contexto.",
  },
  {
    icon: ShoppingCart,
    title: "Sua empresa conectada de ponta a ponta.",
    description:
      "Uma única identidade para comerciantes, fornecedores, vendedores e workspaces autorizados.",
  },
] as const;

export const AuthChoicePage = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[activeSlide];
  const SlideIcon = slide.icon;

  return (
    <main className="msd-auth-choice">
      <section className="msd-auth-choice__showcase">
        <AppBrand />

        <div className="msd-auth-choice__slides">
          <article className="msd-auth-choice__slide" key={slide.title}>
            <div className="msd-auth-choice__preview" aria-hidden="true">
              <div className="msd-auth-choice__preview-grid">
                <div className="msd-auth-choice__preview-nav">
                  <div className="msd-auth-choice__preview-dots">
                    <span className="msd-auth-choice__preview-dot" />
                    <span className="msd-auth-choice__preview-dot" />
                    <span className="msd-auth-choice__preview-dot" />
                    <span className="msd-auth-choice__preview-dot" />
                  </div>
                </div>
                <div className="msd-auth-choice__preview-content">
                  <SlideIcon size={34} />
                  <span className="msd-auth-choice__preview-heading" />
                  <span className="msd-auth-choice__preview-subheading" />
                  <div className="msd-auth-choice__preview-cards">
                    <span className="msd-auth-choice__preview-card" />
                    <span className="msd-auth-choice__preview-card" />
                    <span className="msd-auth-choice__preview-card" />
                  </div>
                  <span className="msd-auth-choice__preview-chart" />
                </div>
              </div>
            </div>

            <div className="msd-auth-choice__copy">
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
            </div>
          </article>
        </div>

        <div className="msd-auth-choice__indicators" aria-label="Destaques">
          {slides.map((item, index) => (
            <button
              key={item.title}
              type="button"
              className={`msd-auth-choice__indicator ${
                index === activeSlide ? "msd-auth-choice__indicator--active" : ""
              }`}
              aria-label={`Abrir destaque ${index + 1}`}
              aria-current={index === activeSlide ? "true" : undefined}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className="msd-auth-choice__access">
        <div className="msd-auth-choice__access-card">
          <div>
            <h2>Bem-vindo ao MyStoreDay.</h2>
            <p>
              Entre com sua conta existente ou crie uma nova conta para configurar sua empresa.
            </p>
          </div>

          <div className="msd-auth-choice__buttons">
            <AppButton onClick={() => navigate(routePaths.login)}>
              Entrar <ArrowRight size={18} aria-hidden="true" />
            </AppButton>
            <AppButton
              variant="secondary"
              onClick={() => navigate(routePaths.signUp)}
            >
              Criar conta
            </AppButton>
          </div>

          <p className="msd-auth-footer">
            Ao continuar, você concorda com os nossos{" "}
            <a href={routePaths.terms}>Termos de Uso</a> e a{" "}
            <a href={routePaths.privacy}>Política de Privacidade</a>.
          </p>
        </div>
      </section>
    </main>
  );
};
