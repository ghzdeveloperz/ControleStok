import type { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { AppBrand } from "./AppBrand";
import { AuthInventoryPreview } from "./AuthInventoryPreview";

export type AuthShellMode = "login" | "register";

export interface AuthShellProps {
  readonly children: ReactNode;
  readonly title?: string;
  readonly description?: string;
  readonly mode?: AuthShellMode;
}

export const AuthShell = ({
  children,
  title = "Controle completo do seu estoque.",
  description =
    "Produtos, validade, fornecedores, entradas e saídas organizados em uma única plataforma.",
  mode = "login",
}: AuthShellProps) => (
  <main className={`msd-auth-shell msd-auth-shell--${mode}`}>
    <section className="msd-auth-shell__content">
      <div className="msd-auth-shell__form-scroll">
        <div className="msd-auth-shell__form-column">
          <AppBrand />

          <div className="msd-auth-shell__form-content">{children}</div>

          <footer className="msd-auth-shell__security">
            <span className="msd-auth-shell__security-icon" aria-hidden="true">
              <LockKeyhole size={17} strokeWidth={2.1} />
            </span>

            <p>
              Seus dados são protegidos com autenticação segura e comunicação
              criptografada.
            </p>
          </footer>
        </div>
      </div>
    </section>

    <section
      className="msd-auth-shell__visual"
      aria-label={`${title} ${description}`}
    >
      <AuthInventoryPreview />
    </section>
  </main>
);
