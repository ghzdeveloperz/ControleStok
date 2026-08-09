# CHANGELOG

## [Milestone 001] — Autenticação e App Check Web

- Firebase App Check integrado ao frontend Web.
- Login migrado para Firebase Authentication com e-mail e senha.
- Removidos o Custom Token e a Function inexistente `loginWithPassword`.
- Implementadas persistência de sessão e resolução da empresa ativa pelo UID.
- Autenticação Web alinhada ao fluxo utilizado pelo aplicativo mobile.
- Corrigidos erros de CORS, App Check e TypeScript.

Detalhes: [Milestone 001](docs/milestones/milestone-001.md)

---

## Milestone 002

- Refatoração Clean Architecture da autenticação.
- Nova rota oficial `/sign-up`.
- Cadastro progressivo por e-mail.
- Verificação antes da definição de senha.
- Reenvio, cooldown e troca de e-mail.
- Recuperação do cadastro pendente.
- Preparação do onboarding empresarial.
- Integração com Firebase App Check.
- Ajustes de CSP e Firebase Hosting.
- Publicação em domínio próprio.
- Correções de TypeScript e build de produção.

Detalhes: [Milestone 002](docs/milestones/milestone-002.md)

---

## Milestone 003 — Refinamento do Onboarding de Empresa

- Reestruturado o fluxo de configuração inicial em três etapas.
- Organizados os dados principais e opcionais da empresa.
- Adicionado tipo de negócio personalizado para a opção `Outro`.
- Separados os aceites de Termos de Uso e Política de Privacidade.
- Implementado resumo final minimalista.
- Criado botão de ação reutilizável.
- Corrigidos foco dos inputs, scroll interno, alertas e cortes de conteúdo.

Detalhes: [Milestone 003](docs/milestones/milestone-003.md)

---

## Milestone 004 — Home Institucional e Ecossistema MyStoreDay

- Reestruturada completamente a Home principal do MyStoreDay.
- Reposicionada a página de landing page SaaS para apresentação institucional da marca.
- Criada apresentação dedicada do MyStoreDay para Comércios.
- Criada apresentação dedicada do MyStoreDay para Fornecedores.
- Adicionada representação visual do ecossistema conectado entre produtos, estoque, movimentações, fornecedores e métricas.
- Criada seção de produto em ação com dashboard ilustrativo.
- Refinado o Hero principal com hierarquia tipográfica mais forte e comunicação mais direta.
- Mantido Header flutuante com efeito Liquid Glass e animação de ocultação no scroll.
- Reduzido o uso de cards genéricos, checklists excessivos e elementos típicos de templates SaaS.
- Adotada composição mais editorial, minimalista e orientada a produto.
- Mantida a identidade visual existente com tokens oficiais do Design System.
- Preservados light mode, dark mode, responsividade e `prefers-reduced-motion`.
- Removidas estatísticas públicas estáticas e seções genéricas sem necessidade institucional.
- Mantidas zero novas dependências para a implementação da Home.

Detalhes: [Milestone 004](docs/milestones/milestone-004.md)
