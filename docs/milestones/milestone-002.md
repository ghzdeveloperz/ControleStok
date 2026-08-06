# Milestone 002 — Autenticação Web Progressiva e Arquitetura Clean

## Visão Geral

Este milestone consolida a evolução iniciada no Milestone 001, transformando a autenticação Web do MyStoreDay em uma base mais profissional, escalável e alinhada ao aplicativo mobile.

O foco principal foi reorganizar login, cadastro, verificação de e-mail, definição de senha, onboarding empresarial, rotas públicas e preparação para sincronização total com o backend compartilhado.

## Funcionalidades

- Criada a nova rota internacional de cadastro:
  - `/sign-up`.
- Padronizadas rotas públicas em inglês:
  - `/access`.
  - `/login`.
  - `/sign-up`.
  - `/verify-email`.
  - `/set-password`.
  - `/company-setup`.
  - `/privacy-policy`.
  - `/terms-of-use`.
- Mantidos redirecionamentos temporários para rotas antigas.
- Implementado o cadastro progressivo dividido em etapas:
  - Informar e-mail.
  - Enviar link de verificação.
  - Aguardar confirmação.
  - Reenviar e-mail com cooldown.
  - Alterar o e-mail informado.
  - Definir senha somente após confirmação.
  - Confirmar senha antes da criação da conta.
  - Redirecionar para configuração da empresa.
- Adicionada recuperação do cadastro pendente após atualização da página.
- Adicionada persistência local somente de dados não sensíveis.
- Mantido suporte ao login com Google.
- Mantido o fluxo atual de login por e-mail e senha.
- Adicionada compatibilidade temporária com a antiga página de cadastro.

## Arquitetura

- Reorganizada a feature de autenticação em camadas:
  - `domain`.
  - `application`.
  - `data`.
  - `presentation`.
- Criada base arquitetural para onboarding empresarial.
- Separadas responsabilidades de:
  - Firebase Authentication.
  - Estado do cadastro.
  - Persistência temporária.
  - Validação.
  - Apresentação.
- Criados contratos e entidades para:
  - Identidade autenticada.
  - Sessão de cadastro.
  - Etapas do cadastro.
  - Falhas de autenticação.
- Removida a concentração de regras diretamente nas páginas.
- Preparada a Web para integração futura com as mesmas raízes canônicas do mobile:
  - `merchants`.
  - `suppliers`.
  - `sellers`.
- Não foi criada nenhuma coleção exclusiva para cadastros Web.
- Mantida a coleção `users` fora da nova arquitetura.

## Design System e Interface

- Atualizada a identidade visual da autenticação.
- Substituído ícone e texto separados pela imagem oficial:
  - `assets/images/logo-and-name.png`.
- Aplicada a logo oficial:
  - No formulário de autenticação.
  - No preview do sistema.
- Removido o ícone adicional do título do preview.
- Mantido o layout premium dividido entre:
  - Formulário.
  - Preview operacional.
- Corrigida a responsividade do formulário em telas menores.
- Ajustada a ordem mobile:
  - Primeiro o formulário.
  - Depois o preview.
- Corrigido o retângulo interno de foco nos campos.
- Ajustada a rolagem para evitar que mensagens de erro quebrem a tela inteira.
- Corrigidos conflitos entre logo, título e conteúdo do cadastro.
- Preparado o layout para estados curtos e progressivos de cadastro.

## Validações

- Adicionada validação de formato de e-mail antes da liberação do envio.
- Adicionada validação de força da senha.
- Adicionada validação de confirmação de senha.
- O botão de criação da conta permanece bloqueado enquanto:
  - A senha não for aceitável.
  - As senhas não coincidirem.
  - Houver operação em andamento.
- Adicionada normalização de e-mail.
- Mantido limite de tamanho para campos sensíveis.
- Ajustada tipagem estrita dos estados do cadastro.

## Firebase Authentication

- Implementado envio de link de autenticação por e-mail.
- Implementada conclusão do cadastro por link recebido.
- Implementada definição de senha após autenticação por link.
- Implementado controle de persistência da sessão Firebase.
- Implementado estado de verificação pendente.
- Implementado reenvio de link com cooldown.
- Implementada troca do e-mail durante cadastro pendente.
- Preparada detecção automática da confirmação do e-mail.
- Mantida integração com Google Sign-In.

## Firebase Hosting

- Preparado deploy Web com Vite e Firebase Hosting.
- Configurada publicação da pasta:
  - `dist`.
- Mantido rewrite para React Router:
  - Todas as rotas públicas retornam `index.html`.
- Criado fluxo de preview por Firebase Hosting Channel.
- Publicado e validado o domínio próprio:
  - `mystoreday.com`.
- Autorizado o domínio no Firebase Authentication.
- Preparada autorização de domínio no reCAPTCHA Enterprise.
- Ajustada a política CSP para serviços do Firebase.
- Identificados e incluídos endpoints necessários para:
  - Firebase Authentication.
  - App Check.
  - Firestore.
  - Cloud Functions.
  - reCAPTCHA.
  - Google Analytics.

## Firebase App Check

- Integrado reCAPTCHA Enterprise ao ambiente Web.
- Separada configuração local e produção:
  - Debug ativo somente em desenvolvimento.
  - Debug desativado em produção.
- Padronizada a variável:
  - `VITE_FIREBASE_APP_CHECK_SITE_KEY`.
- Ajustado o build para usar configuração segura de produção.
- Corrigidos bloqueios de CSP relacionados ao App Check.
- Identificada a necessidade de liberar:
  - `firebase.googleapis.com`.
  - `content-firebaseappcheck.googleapis.com`.
- Preparado suporte ao domínio próprio no App Check.

## Correções Técnicas

- Corrigido estado inválido:
  - `identity`.
  - Substituído por `email_entry`.
- Corrigida construção incompleta de `RegistrationSession`.
- Garantido que `startedAt` seja sempre obrigatório.
- Corrigido uso de parameter property incompatível com:
  - `erasableSyntaxOnly`.
- Ajustada a classe `AuthFailure`.
- Corrigido closure antigo durante atualização do e-mail.
- Corrigidas dependências dos efeitos do fluxo de cadastro.
- Validado o projeto com:
  - `tsc -b`.
  - `vite build`.

## Segurança

- Nenhuma senha é armazenada no Local Storage.
- Nenhuma credencial Firebase é persistida manualmente.
- Apenas dados não sensíveis do cadastro pendente são armazenados.
- O App Check Debug não é enviado para produção.
- Mantida separação entre configuração pública Web e segredos privados.
- Configurados headers de segurança no Firebase Hosting:
  - Content Security Policy.
  - HSTS.
  - Referrer Policy.
  - Permissions Policy.
  - X-Content-Type-Options.
  - X-Frame-Options.
  - Cross-Origin-Opener-Policy.
- Preparada a base para que criação de empresa e aceite legal sejam validados posteriormente pelo backend.

## Limitações Atuais

- O onboarding empresarial definitivo ainda será alinhado ao backend e ao fluxo mobile.
- A criação canônica de `merchants`, `suppliers` e `sellers` ainda será centralizada em Functions.
- As regras completas de CNPJ, termos e política ainda serão integradas ao backend.
- O fluxo mobile ainda não foi alterado.
- A compatibilidade com arquivos antigos ainda foi mantida temporariamente.

## Resultado

A Web agora possui uma base de autenticação mais limpa, modular e preparada para compartilhar o mesmo domínio de negócio do aplicativo mobile, mantendo identidade visual consistente, rotas internacionais, cadastro progressivo e suporte ao domínio oficial do MyStoreDay.
