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



