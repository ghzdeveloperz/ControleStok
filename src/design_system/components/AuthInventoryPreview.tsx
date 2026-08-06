import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  PackageX,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Truck,
  UsersRound,
} from "lucide-react";
import logoAndNameImage from "../../../assets/images/logo-and-name.png";

interface PreviewMetricProps {
  readonly icon: typeof AlertTriangle;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly tone: "warning" | "danger" | "neutral" | "primary";
}

const PreviewMetric = ({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: PreviewMetricProps) => (
  <article className="msd-auth-preview-metric">
    <span
      className={`msd-auth-preview-metric__icon msd-auth-preview-metric__icon--${tone}`}
      aria-hidden="true"
    >
      <Icon size={16} strokeWidth={2.2} />
    </span>

    <div className="msd-auth-preview-metric__content">
      <span>{label}</span>

      <div>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  </article>
);

interface SummaryMetricProps {
  readonly label: string;
  readonly value: string;
  readonly variation: string;
  readonly direction: "up" | "down";
}

const SummaryMetric = ({
  label,
  value,
  variation,
  direction,
}: SummaryMetricProps) => (
  <article className="msd-auth-dashboard-summary-card">
    <span>{label}</span>
    <strong>{value}</strong>

    <small
      className={
        direction === "up"
          ? "msd-auth-dashboard-summary-card__positive"
          : "msd-auth-dashboard-summary-card__negative"
      }
    >
      {direction === "up" ? (
        <ArrowUpRight size={12} aria-hidden="true" />
      ) : (
        <ArrowDownRight size={12} aria-hidden="true" />
      )}
      {variation}
    </small>
  </article>
);

const sidebarItems = [
  ["Resumo", BarChart3],
  ["Produtos", Boxes],
  ["Estoque", PackageCheck],
  ["Movimentações", RefreshCw],
  ["Fornecedores", Truck],
  ["Membros", UsersRound],
  ["Configurações", Settings2],
] as const;

const expiryProducts = [
  ["Leite integral", "18", "5 dias", "danger"],
  ["Iogurte natural", "24", "7 dias", "warning"],
  ["Queijo muçarela", "10", "10 dias", "attention"],
  ["Creme de leite", "6", "13 dias", "neutral"],
] as const;

const movements = [
  ["Entrada de produtos", "Hoje, 09:25", "+120 itens", "positive"],
  ["Saída de produtos", "Hoje, 08:10", "-45 itens", "negative"],
  ["Entrada de produtos", "Ontem, 17:45", "+60 itens", "positive"],
] as const;

export const AuthInventoryPreview = () => (
  <div className="msd-auth-preview" aria-hidden="true">
    <div className="msd-auth-preview__headline">
      <h2>
        Controle completo do seu estoque,
        <br />
        decisões melhores para o seu negócio.
      </h2>

      <p>
        Monitore produtos, validade, fornecedores, entradas e saídas em tempo
        real.
      </p>
    </div>

    <div className="msd-auth-preview__metrics">
      <PreviewMetric
        icon={AlertTriangle}
        label="Perto da validade"
        value="12"
        detail="produtos"
        tone="warning"
      />

      <PreviewMetric
        icon={ShieldCheck}
        label="Estoque crítico"
        value="7"
        detail="produtos"
        tone="danger"
      />

      <PreviewMetric
        icon={PackageX}
        label="Indisponíveis"
        value="3"
        detail="produtos"
        tone="neutral"
      />

      <PreviewMetric
        icon={RefreshCw}
        label="Giro de produtos"
        value="2,45"
        detail="média geral"
        tone="primary"
      />
    </div>

    <section className="msd-auth-dashboard">
      <aside className="msd-auth-dashboard__sidebar">
        <div className="msd-auth-dashboard__brand">
          <img
            src={logoAndNameImage}
            alt="MyStoreDay"
            className="msd-auth-dashboard__brand-image"
          />
        </div>

        <nav className="msd-auth-dashboard__navigation">
          {sidebarItems.map(([label, Icon], index) => (
            <div
              key={label}
              className={`msd-auth-dashboard__navigation-item ${
                index === 0
                  ? "msd-auth-dashboard__navigation-item--active"
                  : ""
              }`}
            >
              <Icon size={13} />
              <span>{label}</span>
            </div>
          ))}
        </nav>

        <div className="msd-auth-dashboard__profile">
          <span>GA</span>

          <div>
            <strong>Gabriel</strong>
            <small>Administrador</small>
          </div>
        </div>
      </aside>

      <div className="msd-auth-dashboard__content">
        <header className="msd-auth-dashboard__header">
          <div>
            <strong>Resumo geral</strong>
            <span>Visão consolidada da operação</span>
          </div>

          <span className="msd-auth-dashboard__date">
            <CalendarDays size={12} />
            20/05/2026 - 20/06/2026
          </span>
        </header>

        <div className="msd-auth-dashboard__summary">
          <SummaryMetric
            label="Entradas"
            value="1.250"
            variation="+15,4%"
            direction="up"
          />

          <SummaryMetric
            label="Saídas"
            value="980"
            variation="-8,7%"
            direction="down"
          />

          <SummaryMetric
            label="Valor em estoque"
            value="R$ 87.650"
            variation="+12,3%"
            direction="up"
          />

          <SummaryMetric
            label="Produtos cadastrados"
            value="1.350"
            variation="+5,2%"
            direction="up"
          />
        </div>

        <div className="msd-auth-dashboard__grid">
          <article className="msd-auth-dashboard-panel">
            <header className="msd-auth-dashboard-panel__header">
              <strong>Produtos próximos da validade</strong>
              <span>Estoque atual</span>
            </header>

            <div className="msd-auth-dashboard-table">
              <div className="msd-auth-dashboard-table__header">
                <span>Produto</span>
                <span>Estoque</span>
                <span>Restante</span>
              </div>

              {expiryProducts.map(([name, stock, days, tone]) => (
                <div key={name} className="msd-auth-dashboard-table__row">
                  <span>{name}</span>
                  <span>{stock}</span>
                  <span
                    className={`msd-auth-dashboard-pill msd-auth-dashboard-pill--${tone}`}
                  >
                    {days}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="msd-auth-dashboard-panel">
            <header className="msd-auth-dashboard-panel__header">
              <strong>Giro de produtos</strong>
              <span>Média geral</span>
            </header>

            <div className="msd-auth-chart">
              <div className="msd-auth-chart__axis">
                <span>3,0</span>
                <span>2,0</span>
                <span>1,0</span>
                <span>0</span>
              </div>

              <div className="msd-auth-chart__plot">
                <svg
                  viewBox="0 0 320 130"
                  preserveAspectRatio="none"
                  role="presentation"
                >
                  <defs>
                    <linearGradient
                      id="msd-auth-chart-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#2f6df6" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#2f6df6" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <path
                    className="msd-auth-chart__area"
                    d="M0 112 C20 110 26 84 48 84 C74 84 72 63 97 68 C120 72 125 42 151 49 C177 55 179 77 206 72 C231 66 239 55 263 61 C283 66 294 55 320 59 L320 130 L0 130 Z"
                  />

                  <path
                    className="msd-auth-chart__line"
                    d="M0 112 C20 110 26 84 48 84 C74 84 72 63 97 68 C120 72 125 42 151 49 C177 55 179 77 206 72 C231 66 239 55 263 61 C283 66 294 55 320 59"
                  />

                  <circle cx="48" cy="84" r="3.5" />
                  <circle cx="97" cy="68" r="3.5" />
                  <circle cx="151" cy="49" r="3.5" />
                  <circle cx="206" cy="72" r="3.5" />
                  <circle cx="263" cy="61" r="3.5" />
                  <circle cx="320" cy="59" r="3.5" />
                </svg>

                <span className="msd-auth-chart__value">2,45</span>

                <div className="msd-auth-chart__labels">
                  <span>20/05</span>
                  <span>27/05</span>
                  <span>03/06</span>
                  <span>10/06</span>
                  <span>17/06</span>
                  <span>20/06</span>
                </div>
              </div>
            </div>
          </article>

          <article className="msd-auth-dashboard-panel">
            <header className="msd-auth-dashboard-panel__header">
              <strong>Vínculos com fornecedores</strong>
              <span>Produtos vinculados</span>
            </header>

            <div className="msd-auth-dashboard-list">
              <div>
                <span>Distribuidora Souza</span>
                <strong>320</strong>
              </div>
              <div>
                <span>Comercial de Alimentos</span>
                <strong>210</strong>
              </div>
              <div>
                <span>Atacadão São Paulo</span>
                <strong>185</strong>
              </div>
            </div>
          </article>

          <article className="msd-auth-dashboard-panel">
            <header className="msd-auth-dashboard-panel__header">
              <strong>Últimas movimentações</strong>
              <span>Atualizadas agora</span>
            </header>

            <div className="msd-auth-dashboard-list">
              {movements.map(([name, date, amount, tone]) => (
                <div key={`${name}-${date}`}>
                  <span>
                    {name}
                    <small>{date}</small>
                  </span>

                  <strong
                    className={`msd-auth-dashboard-movement msd-auth-dashboard-movement--${tone}`}
                  >
                    {amount}
                  </strong>
                </div>
              ))}
            </div>
          </article>
        </div>

        <footer className="msd-auth-dashboard__footer">
          <span>
            <CircleDollarSign size={12} />
            Dados ilustrativos
          </span>
          <span>Visão operacional MyStoreDay</span>
        </footer>
      </div>
    </section>
  </div>
);
