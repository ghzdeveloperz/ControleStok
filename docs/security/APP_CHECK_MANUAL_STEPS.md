# Firebase App Check Web — Ações manuais

> As variáveis `VITE_*` são públicas e podem ser incluídas no bundle Web. Este documento não contém e nunca deve receber token de debug, senha, chave privada, service account ou segredo administrativo.

## 1. Estado da implementação

Legenda: `[x]` concluído, `[ ]` pendente e `[!]` bloqueado por ação externa.

- [x] Configuração Firebase tipada, normalizada, imutável e com falha explícita para valores ausentes, placeholders ou flags inválidas.
- [x] App Check inicializado depois do Firebase App e antes de Auth, Firestore e Functions.
- [x] `ReCaptchaEnterpriseProvider` configurado para os ambientes que acessam o projeto remoto.
- [x] Debug Provider limitado a `DEV`, modo não produtivo, flag explícita e hostname local.
- [x] Debug Provider impedido em produção por validação fail-closed e condição estática de `import.meta.env`.
- [x] Renovação automática do token habilitada.
- [x] Inicialização idempotente durante HMR para Firebase App, App Check e conexões com emuladores.
- [x] Variáveis de ambiente e tipagens Vite adicionadas.
- [x] `.env.local` e `.env.*.local` ignorados pelo Git; nenhum deles está rastreado.
- [x] Exports `auth`, `googleProvider`, `db` e `functions` disponíveis; `app` e `appCheck` também são exportados.
- [x] Analytics inicializado de forma assíncrona apenas quando suportado e sem bloquear o bootstrap.
- [x] Build estrutural, lint e todos os testes existentes foram executados.
- [!] Smoke test do App Check, obtenção de token e build publicável bloqueados até preencher as variáveis reais e testar em navegador/domínio autorizado.
- [!] CSP do Hosting bloqueia o endpoint de troca de tokens usado pelo SDK atual; corrigir em uma fase autorizada antes de publicar.
- [!] Papel IAM da conta de serviço runtime precisa ser confirmado para a proteção contra replay preexistente.
- [!] Configuração remota informada — App Check registrado, TTL de 1 hora, limite de risco `0,5` e enforcement do Console desativado — precisa ser confirmada no Firebase/Google Cloud Console.

Validação executada em 3 de agosto de 2026:

- `npm ls firebase`: Firebase `12.16.0` instalado e deduplicado.
- `npm run build`: concluído; o Vite emitiu apenas o aviso preexistente de chunk superior a 500 kB.
- `npm run lint`: concluído sem erros.
- Rules: 8 testes aprovados.
- Functions: 9 testes aprovados.
- Migração: 1 teste aprovado.
- Provisionamento: 1 teste aprovado.
- Hosting: 1 teste aprovado.
- `npm run check --prefix functions`: sintaxe do backend aprovada.
- `git diff --check`: concluído sem erro.
- `git status --short`: somente os sete arquivos versionáveis desta fase estão alterados ou novos; `.env.local` permanece ignorado.
- Não existem scripts genéricos `typecheck`, `npm test` ou `npm run test`; o typecheck faz parte de `npm run build` e os cinco scripts `test:*` foram executados.
- `npm audit --omit=dev`: falhou com 2 vulnerabilidades high na cadeia de `react-router`, corrigíveis apenas por mudança potencialmente incompatível segundo o npm.
- `npm run security:audit`: falhou por 7 advisories transitivos ainda não allowlisted em root, Functions e CLI isolada. Nenhum foi introduzido pelas alterações do App Check; não foi executado `audit fix`.

O build sem o conjunto completo de variáveis reais valida TypeScript e empacotamento, mas não executa o bootstrap do navegador. Portanto, ele não comprova Site Key, emissão de token, allowlist de domínio, métricas ou CSP em produção.

As suítes aprovadas também não exercitam `src/config/env.ts`, `src/firebase/app-check.ts`, o Debug Provider, tokens de uso limitado ou enforcement real. Nos emuladores, App Check permanece desativado. Esses itens dependem dos smoke tests das seções 3 a 6.

## 2. Valores que precisam ser preenchidos

Os seis identificadores públicos do Firebase Web e o Measurement ID já existentes foram migrados para `.env.local`, que permanece ignorado. O único valor local ausente é:

- `VITE_FIREBASE_APP_CHECK_SITE_KEY`

O ambiente do workflow de produção ainda precisa disponibilizar, sem publicar valores em logs:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_APP_CHECK_SITE_KEY`

Opcional no workflow:

- `VITE_FIREBASE_MEASUREMENT_ID`

As flags `VITE_FIREBASE_APP_CHECK_DEBUG` e `VITE_ALLOW_PRODUCTION_FIREBASE` usam `false` como padrão seguro.

Não copie `.env.example` sem substituir todos os valores `replace-with-*`; a validação rejeita esses placeholders explicitamente.

Obter o Firebase Web Config em:

Firebase Console → Configurações do projeto → Geral → Seus apps → MyStoreDay Web → Configuração do SDK.

Obter a Site Key vinculada ao App Check em:

Google Cloud Console → reCAPTCHA Enterprise → Chaves → chave score-based usada pelo MyStoreDay.

Também é possível conferir o vínculo em Firebase Console → Segurança → App Check → Apps.

A Site Key do reCAPTCHA Enterprise e o Firebase Web Config são identificadores públicos do cliente. O token de debug é uma credencial sensível de bypass e nunca deve ser colocado em código, arquivo `.env`, `VITE_*`, documentação, CI sem cofre apropriado ou Git.

### Pendência do workflow de produção

O workflow atual injeta somente a Site Key com o nome legado `VITE_FIREBASE_APPCHECK_SITE_KEY`. A implementação aceita esse nome temporariamente para compatibilidade, mas o nome oficial desta fase é `VITE_FIREBASE_APP_CHECK_SITE_KEY`.

Antes de publicar:

1. Disponibilizar no job de build todas as variáveis obrigatórias listadas acima.
2. Migrar o mapeamento da Site Key para `VITE_FIREBASE_APP_CHECK_SITE_KEY`.
3. Executar o build com os valores reais.
4. Remover o fallback legado em uma alteração posterior, depois que nenhum ambiente usar o nome antigo.

Sem isso, o artifact pode compilar e falhar imediatamente ao abrir no navegador. Não fazer deploy desse artifact.

### Bloqueio da Content Security Policy

O Firebase App Check `12.16.0` usa `https://content-firebaseappcheck.googleapis.com/v1` para `exchangeRecaptchaEnterpriseToken` e `exchangeDebugToken`. A diretiva `connect-src` atual de `firebase.json` permite `https://firebaseappcheck.googleapis.com`, mas não permite a origem usada pelo SDK.

`firebase.json` pertence ao Firebase Hosting e foi explicitamente excluído do escopo desta fase. Antes de qualquer publicação, uma alteração autorizada deve adicionar `https://content-firebaseappcheck.googleapis.com` ao `connect-src`, preservar as origens existentes, executar os testes de Hosting e validar o header no domínio publicado. Sem isso, emissão e renovação de tokens serão bloqueadas pelo navegador.

Se `VITE_FIREBASE_MEASUREMENT_ID` for usado, validar separadamente os endpoints do Firebase Analytics na Content Security Policy. A inicialização foi feita como não bloqueante, mas a CSP atual também não comprova o funcionamento do Analytics.

## 3. Registrar token de debug

O desenvolvimento padrão usa emuladores e não inicializa App Check. Para validar o Debug Provider contra o app remoto registrado, faça essa operação conscientemente e sem executar mutações de produção:

1. Preencha o Firebase Web Config e a Site Key em `.env.local`.
2. Defina `VITE_FIREBASE_APP_CHECK_DEBUG=true` somente nesse ambiente local.
3. Defina `VITE_ALLOW_PRODUCTION_FIREBASE=true` somente durante esse teste; essa flag conecta Auth, Firestore e Functions ao projeto remoto.
4. Execute `npm run dev`.
5. Abra a aplicação local e o Console das ferramentas de desenvolvedor do navegador.
6. Copie o token de debug gerado pelo próprio Firebase SDK. O código do projeto não captura, imprime adicionalmente, envia nem persiste esse token.
7. Acesse:

   Firebase Console → Segurança → App Check → Apps → MyStoreDay Web → menu do aplicativo → Gerenciar tokens de depuração → Adicionar token.

8. Cadastre o token, recarregue a aplicação e confirme que o SDK obtém um token App Check válido sem erro `401` ou `403`.
9. Ao concluir, volte `VITE_FIREBASE_APP_CHECK_DEBUG` e `VITE_ALLOW_PRODUCTION_FIREBASE` para `false` ou remova as flags locais. Nunca copie o token para `.env.local` ou outro arquivo.

Se um token for exposto, revogue-o imediatamente em **Gerenciar tokens de depuração**. Não adicione `localhost` ou `127.0.0.1` aos domínios permitidos do reCAPTCHA Enterprise. Consulte o [procedimento oficial do Debug Provider](https://firebase.google.com/docs/app-check/web/debug-provider).

## 4. Teste local

Executar após registrar o token de debug:

- [ ] Home abre sem erro de bootstrap.
- [ ] Login abre.
- [ ] Login válido conclui via Firebase Authentication.
- [ ] Firestore carrega.
- [ ] Produtos carregam.
- [ ] Categorias carregam.
- [ ] Relatórios carregam.
- [ ] Callables retornam sem erro de App Check.
- [ ] Console não apresenta falha do App Check ou violação CSP relacionada ao provider.
- [ ] Token de debug foi aceito.
- [ ] Nenhum token aparece em logs próprios da aplicação, storage manual ou requisições não Firebase.

O `vite preview` e o emulador de Hosting em `localhost` validam apenas o bundle/Hosting; eles não validam o provider de produção.

## 5. Teste no domínio publicado

Domínios encontrados durante a auditoria:

- `controllstok.web.app`: domínio de Hosting confirmado pelo workflow de verificação.
- `controllstok.firebaseapp.com`: encontrado como `authDomain` na configuração anterior; confirmar no Console se também é um domínio de Hosting realmente servido e autorizado.

Nenhum domínio customizado foi encontrado no repositório.

1. Confirme no Google Cloud Console que todo domínio publicado legítimo está autorizado na chave correta do reCAPTCHA Enterprise.
2. Corrija e teste o `connect-src` descrito na seção 2.
3. Publique somente depois do build com variáveis reais e aprovação do checklist desta fase.
4. Teste os mesmos fluxos da seção anterior no domínio autorizado.
5. Confirme nas ferramentas de rede que as trocas App Check são bem-sucedidas, sem registrar o conteúdo do token.

Não autorize `localhost`, `127.0.0.1` ou domínios genéricos/wildcards para viabilizar desenvolvimento local.

## 6. Métricas do App Check

1. Acesse Firebase Console → Segurança → App Check → APIs.
2. Selecione Authentication, Cloud Firestore e cada produto usado pelo Web.
3. Observe o período posterior ao teste no domínio publicado.
4. Confirme aumento de requisições verificadas antes de considerar qualquer enforcement.

Categorias:

- **Requisições verificadas:** possuem token App Check válido; são as únicas aceitas depois que o enforcement é ativado.
- **Cliente desatualizado:** não possui token e parece vir de uma versão antiga do SDK/app.
- **Origem desconhecida:** não possui token e não parece vir do Firebase SDK; pode indicar cliente forjado ou uso indevido da API key.
- **Inválidas:** enviam token inválido, inclusive ambientes emulados ou clientes não autênticos.
- **Token reutilizado:** quando exibido para um produto compatível, indica reutilização detectada sob proteção contra replay.

Para Cloud Functions Callable, conferir também os logs estruturados no Google Cloud pelo rótulo `firebase-log-type=callable-request-verification` e os estados `VALID`, `INVALID` e `MISSING`. Consulte as [métricas oficiais do App Check](https://firebase.google.com/docs/app-check/monitor-metrics).

O código atual rejeita `alreadyConsumed`, mas ainda não produz um contador/log sanitizado específico para replay. Os estados padrão acima não substituem essa observabilidade, e a métrica de token reutilizado do Console não deve ser presumida para Callables. Uma fase futura de Functions deve adicionar sinalização sanitizada, sem registrar o token.

## 7. Fiscalização

> **NÃO ATIVAR NOVO ENFORCEMENT AINDA.**

Manter o enforcement do Console desativado para novos produtos até que:

- o Web funcione no domínio de produção;
- o Debug Provider funcione localmente;
- as métricas mostrem tráfego legítimo verificado;
- o aplicativo mobile continue funcionando;
- Authentication, Firestore, Functions e demais serviços usados tenham sido testados;
- clientes antigos e origens desconhecidas tenham sido avaliados.

Esta fase não ativou nem alterou enforcement e não realizou deploy. Entretanto, existe uma configuração preexistente fora do escopo desta fase: `functions/index.js` aplica `enforceAppCheck` e `consumeAppCheckToken` fora do emulador, e o workflow de merge define `APP_CHECK_ENFORCE=true` antes do deploy de Functions. Confirmar o estado efetivamente implantado antes de afirmar que todo enforcement está desligado.

Como `consumeAppCheckToken` está habilitado, confirmar no Google Cloud Console → IAM que a conta de serviço usada pelas Functions possui o papel **Firebase App Check Token Verifier**. Para Functions de 2ª geração com Admin SDK padrão, normalmente é a conta de serviço de computação padrão; identifique a conta efetivamente configurada antes de conceder o menor privilégio necessário. Consulte a [orientação oficial para Cloud Functions](https://firebase.google.com/docs/app-check/cloud-functions).

O estado remoto descrito no início da tarefa não foi validado automaticamente porque nenhuma configuração do Firebase/Google Cloud Console foi alterada ou consultada com credenciais administrativas.

## 8. Deploy

Nenhum deploy foi executado nesta fase.

Não acione o workflow de produção enquanto as variáveis, a CSP e o estado remoto de enforcement não forem confirmados. O workflow também publica Functions com `APP_CHECK_ENFORCE=true`, portanto executá-lo agora pode contrariar o objetivo desta fase.

Depois de resolver todos os bloqueios, o fluxo normal pode continuar pelo workflow de produção com autenticação WIF e todos os gates aprovados. Como referência controlada para um deploy manual **somente de Hosting**, depois de preencher as variáveis e validar o build:

```powershell
node tools/firebase-cli/run-firebase.cjs deploy --only hosting --project controllstok --non-interactive
```

Não executar esse comando enquanto houver qualquer item bloqueado nas seções 1 a 5.

## 9. Rollback

Preferir um commit exclusivo para esta fase. Depois de revisar `git show <commit-da-fase-1>`, reverter de forma auditável e não destrutiva:

```powershell
git revert <commit-da-fase-1>
```

Se as alterações ainda não estiverem em commit, use `git diff` para revisar exatamente `.env.example`, `.gitignore`, `src/config/env.ts`, `src/firebase/app-check.ts`, `src/firebase/firebase.ts`, `src/vite-env.d.ts` e este documento. Salve uma cópia do diff e reverta somente essas edições de forma seletiva. Não use `git reset --hard`, `git clean`, exclusão recursiva ou restauração ampla que possa apagar trabalho não relacionado. O `.env.local` não é rastreado e deve ser tratado separadamente, sem imprimir seu conteúdo.

## 10. Risco crítico pendente — Fase 2

O risco descrito no briefing — login baseado em `localStorage` e bcrypt no navegador — seria crítico, mas não corresponde à árvore atual auditada. O frontend atual chama `loginWithPassword` em Cloud Functions, recebe Custom Token e conclui com Firebase Authentication; não foi encontrado `bcrypt` ou `passwordHash` em `src`.

Esta fase não alterou o login. A Fase 2 deve confirmar operacionalmente que:

- nenhuma versão publicada ou cliente legado ainda autentica por hash/senha no frontend;
- `passwordHash` nunca é enviado ao navegador;
- credenciais legadas foram migradas e removidas dos documentos raiz;
- Custom Claims, `credentialId`, `workspaceId`, roles e rotação continuam validados no backend;
- `auth.currentUser.uid` permanece a identidade canônica no cliente;
- não existe regressão para autenticação baseada apenas em `localStorage`.

Também permanecem fora do escopo desta fase os advisories transitivos da auditoria, o tamanho do bundle principal, a migração das variáveis do workflow e a validação da CSP do Analytics.
