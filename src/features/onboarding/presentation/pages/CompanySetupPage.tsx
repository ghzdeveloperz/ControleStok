import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  FileText,
  LockKeyhole,
  Phone,
  Store,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routePaths } from "../../../../app/router/route-paths";
import { formatCnpj, isValidCnpj } from "../../../../core/validation/cnpj";
import { AppBrand } from "../../../../design_system/components/AppBrand";
import { AppButton } from "../../../../design_system/components/AppButton";
import { AppFeedback } from "../../../../design_system/components/AppFeedback";
import { AppTextField } from "../../../../design_system/components/AppTextField";
import { useAuth } from "../../../auth/application/use-auth";
import {
  AccountRegistrationError,
  completeAccountRegistration,
} from "../../data/account-registration.repository";
import merchantImage from "../../../../../assets/images/wokstype/select_merchants_logo-amplied.png";
import supplierImage from "../../../../../assets/images/wokstype/select_suppliers_logo-amplied.png";
import type { AccountType } from "../../domain/company.types";

import { ProgressActionButton } from "../../../../design_system/components/ProgressActionButton";

const marketingWebsiteUrl = "https://mystoreday.com";

type CompanySetupStep = 1 | 2 | 3;

type BusinessTypeOption = {
  readonly value: string;
  readonly label: string;
  readonly description: string;
};

const businessTypes: readonly BusinessTypeOption[] = [
  { value: "restaurant", label: "Restaurante", description: "Restaurantes, lanchonetes e alimentação." },
  { value: "market", label: "Mercado", description: "Mercados, minimercados e mercearias." },
  { value: "bakery", label: "Padaria", description: "Padarias, confeitarias e produção própria." },
  { value: "pharmacy", label: "Farmácia", description: "Farmácias, drogarias e produtos de saúde." },
  { value: "store", label: "Loja", description: "Varejo físico, digital ou operação híbrida." },
  { value: "workshop", label: "Oficina", description: "Oficinas, assistência e prestação de serviços." },
  { value: "industry", label: "Indústria", description: "Produção, transformação e manufatura." },
  { value: "distributor", label: "Distribuidora", description: "Distribuição, atacado e logística comercial." },
  { value: "other", label: "Outro", description: "Outro modelo de negócio não listado." },
] as const;

const stepLabels = ["Perfil", "Empresa", "Termos"] as const;

interface BooleanFieldButtonProps {
  readonly active: boolean;
  readonly label: string;
  readonly description: string;
  readonly onChange: (value: boolean) => void;
}

const BooleanFieldButton = ({
  active,
  label,
  description,
  onChange,
}: BooleanFieldButtonProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={active}
    className={`msd-company-toggle ${active ? "msd-company-toggle--active" : ""}`}
    onClick={() => onChange(!active)}
  >
    <span>
      <strong>{label}</strong>
      <small>{description}</small>
    </span>
    <span className="msd-company-toggle__switch" aria-hidden="true">
      <span />
    </span>
  </button>
);

interface BusinessTypeSelectProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

const BusinessTypeSelect = ({ value, onChange }: BusinessTypeSelectProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = businessTypes.find((item) => item.value === value);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") setOpen(false);
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div ref={rootRef} className="msd-business-select">
      <span className="msd-field__label">Tipo de negócio</span>
      <button
        type="button"
        className={`msd-business-select__trigger ${open ? "msd-business-select__trigger--open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <Store size={19} aria-hidden="true" />
        <span className="msd-business-select__value">
          <strong>{selected?.label ?? "Selecione o tipo de negócio"}</strong>
          <small>{selected?.description ?? "Escolha a categoria que melhor representa sua operação."}</small>
        </span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>

      {open ? (
        <div className="msd-business-select__menu" role="listbox" aria-label="Tipos de negócio">
          {businessTypes.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                className={`msd-business-select__option ${active ? "msd-business-select__option--active" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
                {active ? <Check size={18} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export const CompanySetupPage = () => {
  const navigate = useNavigate();
  const { user, refreshAccount, logout } = useAuth();

  const [step, setStep] = useState<CompanySetupStep>(1);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [company, setCompany] = useState("");
  const [document, setDocument] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [customBusinessType, setCustomBusinessType] = useState("");
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

  const resolvedBusinessType =
    businessType === "other"
      ? customBusinessType.trim()
      : businessType;

  const acceptedLegal = acceptedTerms && acceptedPrivacy;

  const companyStepValid = useMemo(() => {
    const optionalFieldsValid =
      (!showFantasyName || fantasyName.trim().length >= 2) &&
      (!showOwner || owner.trim().length >= 2) &&
      (!showPhone || phone.replace(/\D/g, "").length >= 10);

    const businessTypeValid =
      businessType.length > 0 &&
      (businessType !== "other" || customBusinessType.trim().length >= 2);

    return (
      company.trim().length >= 2 &&
      isValidCnpj(document) &&
      businessTypeValid &&
      optionalFieldsValid
    );
  }, [
    businessType,
    company,
    customBusinessType,
    document,
    fantasyName,
    owner,
    phone,
    showFantasyName,
    showOwner,
    showPhone,
  ]);

  const goNext = () => {
    setError(null);
    if (step === 1 && accountType) setStep(2);
    if (step === 2 && companyStepValid) setStep(3);
  };

  const goBack = () => {
    setError(null);
    setStep((current) => (current === 3 ? 2 : 1));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || step !== 3 || !accountType || !companyStepValid || !acceptedLegal) return;

    setError(null);
    setSubmitting(true);
    try {
      const result = await completeAccountRegistration({
        accountType,
        company,
        document,
        businessType: resolvedBusinessType,
        fantasyName: showFantasyName ? fantasyName.trim() : undefined,
        owner: showOwner ? owner.trim() : undefined,
        phone: showPhone ? phone.trim() : undefined,
        acceptedTerms: acceptedLegal,
        acceptedPrivacy: acceptedLegal,
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
      setError(caught instanceof Error ? caught.message : "Não foi possível concluir a configuração da empresa.");
    } finally {
      setSubmitting(false);
    }
  };

  const leave = async () => {
    await logout();
    window.location.assign(marketingWebsiteUrl);
  };

  return (
    <main className="msd-company-setup-page">
      <div className="msd-company-setup-page__backdrop" aria-hidden="true" />

      <section className="msd-company-setup-shell" aria-labelledby="company-setup-title">
        <header className="msd-company-setup-shell__topbar">
          <AppBrand />
          <button type="button" className="msd-company-exit" onClick={() => void leave()}>
            Sair
          </button>
        </header>

        <div className="msd-company-progress" aria-label={`Etapa ${step} de 3`}>
          {stepLabels.map((label, index) => {
            const number = (index + 1) as CompanySetupStep;
            const completed = number < step;
            const active = number === step;
            return (
              <div
                key={label}
                className={`msd-company-progress__item ${active ? "msd-company-progress__item--active" : ""} ${completed ? "msd-company-progress__item--completed" : ""}`}
              >
                <span>{completed ? <Check size={15} /> : number}</span>
                <small>{label}</small>
              </div>
            );
          })}
        </div>

        <form className="msd-company-setup-card" onSubmit={submit} noValidate>
          <div
            className={`msd-company-setup-card__feedback ${
              error ? "msd-company-setup-card__feedback--visible" : ""
            }`}
            aria-live="polite"
          >
            {error ? <AppFeedback tone="error">{error}</AppFeedback> : null}
          </div>

          {step === 1 ? (
            <section className="msd-company-step" aria-labelledby="company-setup-title">
              <header className="msd-company-step__header">
                <span className="msd-company-step__eyebrow">Etapa 1 de 3</span>
                <h1 id="company-setup-title">Como você usará o MyStoreDay?</h1>
                <p>Escolha o perfil que melhor representa sua operação. Essa definição organiza seu ambiente e os recursos disponíveis.</p>
              </header>

              <div className="msd-workspace-type-grid" role="radiogroup" aria-label="Tipo de conta">
                <button
                  type="button"
                  role="radio"
                  aria-checked={accountType === "merchant"}
                  className={`msd-workspace-type-card ${accountType === "merchant" ? "msd-workspace-type-card--active" : ""}`}
                  onClick={() => setAccountType("merchant")}
                >
                  <span className="msd-workspace-type-card__image">
                    <img src={merchantImage} alt="" aria-hidden="true" />
                  </span>
                  <span className="msd-workspace-type-card__content">
                    <small>COMERCIANTE</small>
                    <strong>Sou comerciante</strong>
                    <p>Controle estoque, vendas, pedidos, fornecedores e equipe.</p>
                  </span>
                  <span className="msd-workspace-type-card__check" aria-hidden="true">
                    <Check size={17} />
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={accountType === "supplier"}
                  className={`msd-workspace-type-card ${accountType === "supplier" ? "msd-workspace-type-card--active" : ""}`}
                  onClick={() => setAccountType("supplier")}
                >
                  <span className="msd-workspace-type-card__image">
                    <img src={supplierImage} alt="" aria-hidden="true" />
                  </span>
                  <span className="msd-workspace-type-card__content">
                    <small>FORNECEDOR</small>
                    <strong>Sou fornecedor</strong>
                    <p>Gerencie catálogo, clientes, pedidos e operação comercial.</p>
                  </span>
                  <span className="msd-workspace-type-card__check" aria-hidden="true">
                    <Check size={17} />
                  </span>
                </button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section
              className="msd-company-step msd-company-step--company-data"
              aria-labelledby="company-details-title"
            >
              <header className="msd-company-step__header">
                <span className="msd-company-step__eyebrow">Etapa 2 de 3</span>
                <h1 id="company-details-title">Dados da empresa</h1>
                <p>
                  Informe os dados oficiais da operação e, se necessário,
                  adicione informações complementares.
                </p>
              </header>

              <div className="msd-company-step__scroll-area">
                <section
                  className="msd-company-data-group"
                  aria-labelledby="company-primary-data-title"
                >
                  <header className="msd-company-data-group__header">
                    <h2 id="company-primary-data-title">Dados principais</h2>
                    <p>Informações obrigatórias para criar o workspace.</p>
                  </header>

                  <div className="msd-company-data-group__fields">
                    <AppTextField
                      label="Razão social ou nome da empresa"
                      value={company}
                      maxLength={160}
                      required
                      autoComplete="organization"
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
                      onChange={(event) =>
                        setDocument(formatCnpj(event.target.value))
                      }
                      leadingIcon={<FileText size={19} />}
                    />

                    <BusinessTypeSelect
                      value={businessType}
                      onChange={(value) => {
                        setBusinessType(value);
                        if (value !== "other") {
                          setCustomBusinessType("");
                        }
                      }}
                    />

                    {businessType === "other" ? (
                      <AppTextField
                        label="Descreva o tipo de negócio"
                        value={customBusinessType}
                        maxLength={20}
                        required
                        placeholder="Até 20 caracteres"
                        onChange={(event) =>
                          setCustomBusinessType(event.target.value)
                        }
                        leadingIcon={<Store size={19} />}
                      />
                    ) : null}
                  </div>
                </section>

                <section
                  className="msd-company-data-group"
                  aria-labelledby="company-optional-data-title"
                >
                  <header className="msd-company-data-group__header">
                    <h2 id="company-optional-data-title">Dados opcionais</h2>
                    <p>Ative somente as informações que deseja cadastrar.</p>
                  </header>

                  <div className="msd-company-optional-fields">
                    <div className="msd-company-optional-field">
                      <BooleanFieldButton
                        active={showFantasyName}
                        label="Nome fantasia"
                        description="Nome conhecido pelos clientes."
                        onChange={setShowFantasyName}
                      />

                      {showFantasyName ? (
                        <div className="msd-company-optional-field__input">
                          <AppTextField
                            label="Nome fantasia"
                            value={fantasyName}
                            maxLength={160}
                            autoComplete="organization"
                            placeholder="Nome usado comercialmente"
                            onChange={(event) =>
                              setFantasyName(event.target.value)
                            }
                            leadingIcon={<Store size={19} />}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="msd-company-optional-field">
                      <BooleanFieldButton
                        active={showOwner}
                        label="Responsável"
                        description="Pessoa responsável pela operação."
                        onChange={setShowOwner}
                      />

                      {showOwner ? (
                        <div className="msd-company-optional-field__input">
                          <AppTextField
                            label="Responsável"
                            value={owner}
                            maxLength={120}
                            autoComplete="name"
                            placeholder="Nome do responsável"
                            onChange={(event) => setOwner(event.target.value)}
                            leadingIcon={<UserRound size={19} />}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="msd-company-optional-field">
                      <BooleanFieldButton
                        active={showPhone}
                        label="Telefone ou WhatsApp"
                        description="Contato comercial da empresa."
                        onChange={setShowPhone}
                      />

                      {showPhone ? (
                        <div className="msd-company-optional-field__input">
                          <AppTextField
                            label="Telefone ou WhatsApp"
                            value={phone}
                            inputMode="tel"
                            maxLength={20}
                            autoComplete="tel"
                            placeholder="(00) 00000-0000"
                            onChange={(event) => setPhone(event.target.value)}
                            leadingIcon={<Phone size={19} />}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section
              className="msd-company-step msd-company-step--review"
              aria-labelledby="company-legal-title"
            >
              <header className="msd-company-step__header">
                <span className="msd-company-step__eyebrow">Etapa 3 de 3</span>
                <h1 id="company-legal-title">Revise e conclua</h1>
                <p>
                  Confira os dados principais e aceite os documentos legais
                  para concluir a criação do ambiente.
                </p>
              </header>

              <div className="msd-company-review">
                <div>
                  <span>Perfil</span>
                  <strong>
                    {accountType === "supplier"
                      ? "Fornecedor"
                      : "Comerciante"}
                  </strong>
                </div>

                <div>
                  <span>Empresa</span>
                  <strong>{company}</strong>
                </div>

                <div>
                  <span>CNPJ</span>
                  <strong>{document}</strong>
                </div>

                <div>
                  <span>Tipo de negócio</span>
                  <strong>
                    {businessType === "other"
                      ? customBusinessType
                      : businessTypes.find(
                          (item) => item.value === businessType,
                        )?.label}
                  </strong>
                </div>
              </div>

              <div
                className="msd-legal-consents"
                aria-label="Aceites legais obrigatórios"
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={acceptedTerms}
                  className={`msd-legal-consent ${
                    acceptedTerms
                      ? "msd-legal-consent--accepted"
                      : ""
                  }`}
                  onClick={() =>
                    setAcceptedTerms((current) => !current)
                  }
                >
                  <span
                    className="msd-legal-consent__check"
                    aria-hidden="true"
                  >
                    {acceptedTerms ? <Check size={16} /> : null}
                  </span>

                  <span className="msd-legal-consent__content">
                    <strong>Termos de Uso</strong>
                    <small>
                      Li e concordo com as condições de utilização do
                      MyStoreDay.
                    </small>
                  </span>

                  <a
                    href={routePaths.terms}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Ler documento
                  </a>
                </button>

                <button
                  type="button"
                  role="checkbox"
                  aria-checked={acceptedPrivacy}
                  className={`msd-legal-consent ${
                    acceptedPrivacy
                      ? "msd-legal-consent--accepted"
                      : ""
                  }`}
                  onClick={() =>
                    setAcceptedPrivacy((current) => !current)
                  }
                >
                  <span
                    className="msd-legal-consent__check"
                    aria-hidden="true"
                  >
                    {acceptedPrivacy ? <Check size={16} /> : null}
                  </span>

                  <span className="msd-legal-consent__content">
                    <strong>Política de Privacidade</strong>
                    <small>
                      Li e concordo com o tratamento e a proteção dos meus
                      dados.
                    </small>
                  </span>

                  <a
                    href={routePaths.privacy}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Ler documento
                  </a>
                </button>
              </div>
            </section>
          ) : null}

          <footer className="msd-company-setup-card__footer">
            {step > 1 ? (
              <AppButton type="button" variant="secondary" onClick={goBack}>
                <ArrowLeft size={18} aria-hidden="true" /> Voltar
              </AppButton>
            ) : <span />}

            {step < 3 ? (
              <ProgressActionButton
                type="button"
                disabled={(step === 1 && !accountType) || (step === 2 && !companyStepValid)}
                onClick={goNext}
              >
                Avançar
              </ProgressActionButton>
            ) : (
              <ProgressActionButton
                type="submit"
                loading={submitting}
                disabled={!acceptedLegal || !companyStepValid}
              >
                Concluir configuração
              </ProgressActionButton>
            )}
          </footer>
        </form>

        <footer className="msd-company-setup-shell__security">
          <LockKeyhole size={17} aria-hidden="true" />
          <span>Conta: {user?.email ?? "usuário autenticado"}. Seus dados são enviados por conexão criptografada.</span>
        </footer>
      </section>
    </main>
  );
};
