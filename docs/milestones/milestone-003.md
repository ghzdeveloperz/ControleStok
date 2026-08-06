# Milestone 003 — Refinamento do Onboarding de Empresa

## Objetivo

Consolidar a experiência de configuração inicial da empresa, garantindo um fluxo organizado, responsivo, consistente com o Design System e preparado para diferentes tipos de operação.

## Funcionalidades

- Reestruturado o onboarding em três etapas:
  - Perfil.
  - Dados da empresa.
  - Revisão e termos.
- Implementada seleção entre perfil comerciante e fornecedor.
- Adicionado cadastro dos dados principais da empresa:
  - Razão social.
  - CNPJ.
  - Tipo de negócio.
- Implementado suporte ao tipo de negócio `Outro`, com campo personalizado limitado a 20 caracteres.
- Adicionados campos opcionais controlados por switches:
  - Nome fantasia.
  - Responsável.
  - Telefone ou WhatsApp.
- Separados os aceites obrigatórios:
  - Termos de Uso.
  - Política de Privacidade.
- Adicionada revisão final dos dados antes da criação do workspace.
- Implementada validação de CNPJ já vinculado a outra conta.

## Interface e Experiência

- Reorganizados os campos da etapa de empresa em fluxo vertical.
- Removidos cards internos desnecessários para reduzir poluição visual.
- Adicionados subtítulos minimalistas para:
  - Dados principais.
  - Dados opcionais.
- Ajustado o foco dos campos para evitar outline duplicado no input.
- Implementado scroll interno no conteúdo do card.
- Mantidos cabeçalho e rodapé do onboarding fixos.
- Refinada a etapa final com resumo compacto e minimalista.
- Ajustado o alerta de erro para não sobrepor o conteúdo.
- Criado botão de ação personalizado e reutilizável.
- Aplicadas cores coerentes com a identidade visual do MyStoreDay.

## Arquitetura

- Criado componente reutilizável em:

  `src/design_system/components/ProgressActionButton.tsx`

- Criado estilo dedicado em:

  `src/design_system/theme/components/progress-action-button.css`

- Mantida a separação entre:
  - Lógica de onboarding.
  - Componentes do Design System.
  - Estilos globais.
  - Estilos específicos de autenticação e configuração.

## Arquivos Principais

- `src/features/onboarding/presentation/pages/CompanySetupPage.tsx`
- `src/design_system/components/ProgressActionButton.tsx`
- `src/design_system/components/AppTextField.tsx`
- `src/design_system/theme/auth.css`
- `src/design_system/theme/global.css`
- `src/design_system/theme/components/progress-action-button.css`

## Correções

- Corrigido outline quadrado dentro dos inputs.
- Corrigido posicionamento dos campos opcionais.
- Corrigida mudança de altura do card ao ativar opções.
- Corrigido corte de CNPJ e tipo de negócio na revisão.
- Corrigida sobreposição do alerta de erro.
- Corrigida ausência de scroll interno no card.
- Corrigida inconsistência entre as classes do componente de botão e seu CSS.
