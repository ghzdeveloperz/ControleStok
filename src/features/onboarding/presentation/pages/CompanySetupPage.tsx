import { useState } from "react";
import type { FormEvent } from "react";
import { Building2, FileText, Phone, Store, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routePaths } from "../../../../app/router/route-paths";
import { formatCnpj, isValidCnpj } from "../../../../core/validation/cnpj";
import { AppButton } from "../../../../design_system/components/AppButton";
import { AppFeedback } from "../../../../design_system/components/AppFeedback";
import { AppTextField } from "../../../../design_system/components/AppTextField";
import { AuthShell } from "../../../../design_system/components/AuthShell";
import { useAuth } from "../../../auth/application/use-auth";
import {
  AccountRegistrationError,
  completeAccountRegistration,
} from "../../data/account-registration.repository";
import type { AccountType } from "../../domain/company.types";

const businessTypes = [
  ["restaurant", "Restaurante"],
  ["market", "Mercado"],
  ["bakery", "Padaria"],
  ["pharmacy", "Farmácia"],
  ["store", "Loja"],
  ["workshop", "Oficina"],
  ["industry", "Indústria"],
  ["distributor", "Distribuidora"],
  ["other", "Outro"],
] as const;

export const CompanySetupPage = () => {
  const navigate = useNavigate();
  const { user, refreshAccount, logout } = useAuth();

  const [accountType, setAccountType] = useState<AccountType>("merchant");
  const [company, setCompany] = useState("");
  const [document, setDocument] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [fantasyName, setFantasyName] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [showFantasyName, setShowFantasyName] = useState(false);
  const [showOwner, setShowOwner] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!isValidCnpj(document)) {
      setError("Informe um CNPJ válido.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await completeAccountRegistration({
        accountType,
        company,
        document,
        businessType,
        fantasyName: showFantasyName ? fantasyName : undefined,
        owner: showOwner ? owner : undefined,
        phone: showPhone ? phone : undefined,
        acceptedTerms,
        acceptedPrivacy,
      });

      if (!result.onboardingCompleted) {
        throw new AccountRegistrationError(
          "onboarding-not-completed",
          "A empresa foi salva, mas a configuração ainda não foi concluída.",
        );
      }

      await refreshAccount();
      navigate(routePaths.root, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível concluir a configuração da empresa.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const leave = async () => {
    await logout();
    navigate(routePaths.access, { replace: true });
  };

  return (
    <AuthShell
      title="Configure sua empresa."
      description="As informações serão compartilhadas com o aplicativo e validadas pelo backend do MyStoreDay."
    >
      <div className="msd-auth-card" style={{ width: "min(100%, 42rem)" }}>
        <header className="msd-auth-card__header">
          <h1>Dados da empresa</h1>
          <p>Conta: {user?.email ?? "usuário autenticado"}</p>
        </header>

        {error ? <AppFeedback tone="error">{error}</AppFeedback> : null}

        <form className="msd-company-form" onSubmit={submit} noValidate>
          <div className="msd-account-type-grid" role="radiogroup" aria-label="Tipo de conta">
            <button
              type="button"
              role="radio"
              aria-checked={accountType === "merchant"}
              className={`msd-account-type-card ${
                accountType === "merchant" ? "msd-account-type-card--active" : ""
              }`}
              onClick={() => setAccountType("merchant")}
            >
              <strong>Comerciante</strong>
              <span>Controle de estoque, vendas, fornecedores e equipe.</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={accountType === "supplier"}
              className={`msd-account-type-card ${
                accountType === "supplier" ? "msd-account-type-card--active" : ""
              }`}
              onClick={() => setAccountType("supplier")}
            >
              <strong>Fornecedor</strong>
              <span>Catálogo, clientes, pedidos e operação de fornecimento.</span>
            </button>
          </div>

          <div className="msd-form-grid">
            <AppTextField
              className="msd-form-grid__full"
              label="Razão social ou nome da empresa"
              value={company}
              maxLength={160}
              required
              placeholder="Nome registrado da empresa"
              onChange={(event) => setCompany(event.target.value)}
              leadingIcon={<Building2 size={19} />}
            />

            <AppTextField
              label="CNPJ"
              value={document}
              inputMode="numeric"
              maxLength={18}
              required
              placeholder="00.000.000/0000-00"
              onChange={(event) => setDocument(formatCnpj(event.target.value))}
              leadingIcon={<FileText size={19} />}
            />

            <label className="msd-field">
              <span className="msd-field__label">Tipo de negócio</span>
              <span className="msd-field__control">
                <Store size={19} className="msd-field__icon" aria-hidden="true" />
                <select
                  className="msd-field__input"
                  value={businessType}
                  required
                  onChange={(event) => setBusinessType(event.target.value)}
                >
                  <option value="">Selecione</option>
                  {businessTypes.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="msd-check-row msd-form-grid__full">
              <input
                type="checkbox"
                checked={showFantasyName}
                onChange={(event) => setShowFantasyName(event.target.checked)}
              />
              Informar nome fantasia
            </label>
            {showFantasyName ? (
              <AppTextField
                className="msd-form-grid__full"
                label="Nome fantasia"
                value={fantasyName}
                maxLength={160}
                placeholder="Nome usado pelos seus clientes"
                onChange={(event) => setFantasyName(event.target.value)}
                leadingIcon={<Store size={19} />}
              />
            ) : null}

            <label className="msd-check-row msd-form-grid__full">
              <input
                type="checkbox"
                checked={showOwner}
                onChange={(event) => setShowOwner(event.target.checked)}
              />
              Informar responsável
            </label>
            {showOwner ? (
              <AppTextField
                label="Responsável"
                value={owner}
                maxLength={120}
                placeholder="Nome do responsável"
                onChange={(event) => setOwner(event.target.value)}
                leadingIcon={<UserRound size={19} />}
              />
            ) : null}

            <label className="msd-check-row msd-form-grid__full">
              <input
                type="checkbox"
                checked={showPhone}
                onChange={(event) => setShowPhone(event.target.checked)}
              />
              Informar telefone
            </label>
            {showPhone ? (
              <AppTextField
                label="Telefone"
                value={phone}
                inputMode="tel"
                maxLength={20}
                placeholder="(00) 00000-0000"
                onChange={(event) => setPhone(event.target.value)}
                leadingIcon={<Phone size={19} />}
              />
            ) : null}
          </div>

          <label className="msd-check-row">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              Li e aceito os <a href={routePaths.terms} target="_blank" rel="noreferrer">Termos de Uso</a>.
            </span>
          </label>

          <label className="msd-check-row">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
            />
            <span>
              Li e aceito a <a href={routePaths.privacy} target="_blank" rel="noreferrer">Política de Privacidade</a>.
            </span>
          </label>

          <div className="msd-auth-actions">
            <AppButton type="submit" fullWidth loading={submitting}>
              Concluir configuração
            </AppButton>
            <AppButton type="button" fullWidth variant="ghost" onClick={() => void leave()}>
              Sair e continuar depois
            </AppButton>
          </div>
        </form>
      </div>
    </AuthShell>
  );
};
