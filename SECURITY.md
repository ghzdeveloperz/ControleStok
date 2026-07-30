# Operação segura do MyStoreDay Web

## Bloqueios antes do próximo deploy

1. Remova dos dispositivos e trust stores os certificados locais expostos no histórico Git. Os fingerprints SHA-256 identificados são:
   - `D0:5F:56:E3:16:3A:A4:4B:EF:9B:28:EC:92:83:94:9A:B2:D1:CD:B3:7F:F6:3C:F4:38:A3:67:66:DE:28:2C:8D`
   - `8F:B9:5B:D3:F2:54:1B:7C:A1:67:0E:66:B5:02:C9:15:CE:02:A3:83:37:DC:1D:A2:3B:46:C1:B7:CF:7C:74:BA`
2. Gere certificados locais novos fora do Git. O diretório `cert/` é ignorado e o Vite aceita os arquivos locais opcionais `cert/key.pem` e `cert/cert.pem` somente em `127.0.0.1`.
3. Reescreva todas as branches com `git filter-repo`, removendo `cert/key.pem` e `cert/cert.pem` de todos os commits. Faça isso em uma janela coordenada, force-push de todas as branches, solicite ao GitHub a limpeza dos objetos sensíveis e exija novos clones dos colaboradores. Não reutilize clones antigos. Reenumere todas as refs remotas imediatamente antes da reescrita; a lista do exemplo é apenas o snapshot atual e não autoriza omitir branch nova.
4. Habilite ruleset na `master`: pull request obrigatório, checks obrigatórios, revisão, bloqueio de force-push/deleção e secret push protection.

Exemplo depois de criar o commit local e preservar um backup offline. O clone parte da árvore local para incluir a correção ainda não publicada:

```bash
git clone --mirror . ../ControleStok-sanitized.git
cd ../ControleStok-sanitized.git
git filter-repo --force --sensitive-data-removal --invert-paths --path cert/key.pem --path cert/cert.pem
git remote add origin https://github.com/ghzdeveloperz/ControleStok.git
git push origin --force master feat/web-security-foundation relatorios scanner
git push origin --force --tags
```

## Pré-requisitos externos do deploy

- Configure Workload Identity Federation entre GitHub Actions e Google Cloud.
- Restrinja o provider OIDC ao repositório `ghzdeveloperz/ControleStok`, à branch `master` e ao subject do environment `production`; não aceite subjects genéricos da organização.
- No environment GitHub `production`, cadastre `GCP_WORKLOAD_IDENTITY_PROVIDER` e `GCP_FIREBASE_DEPLOY_SERVICE_ACCOUNT`.
- Use uma service account exclusiva de deploy, com apenas os papéis mínimos exigidos por Hosting, Functions, Firestore e Storage. Não conceda `Owner`, `Editor` nem permissões administrativas genéricas.
- Depois de validar o primeiro deploy via WIF, inventarie, desabilite e exclua todas as chaves JSON da service account legada; remova o secret GitHub `FIREBASE_SERVICE_ACCOUNT_CONTROLLSTOK` e reduza ou exclua a conta legada. Não basta parar de referenciar o secret no YAML.
- Proteja o environment `production` com required reviewers, branch de deploy limitada à `master` e sem bypass administrativo rotineiro.
- Remova de pessoas e máquinas a permissão de deploy direto; produção deve ser publicada exclusivamente pelo workflow com WIF. O `.firebaserc` não possui alias `default`, então comandos locais sem `--project` devem falhar.
- Crie uma chave web reCAPTCHA Enterprise restrita aos domínios reais do app, registre-a no Firebase App Check e cadastre seu valor público na variável GitHub `FIREBASE_APPCHECK_SITE_KEY`.
- Conceda à service account de runtime das Functions o papel `Firebase App Check Token Verifier`, necessário para consumir tokens de uso único.
- Conceda à identidade exata de runtime das Functions a permissão `iam.serviceAccounts.signBlob` sobre ela própria (normalmente via `roles/iam.serviceAccountTokenCreator`) e valide a emissão de custom token em staging. Sem isso, `createCustomToken` bloqueia todo login mesmo que o deploy tenha sido concluído.
- Depois de observar as métricas, habilite enforcement do App Check para Authentication e Cloud Firestore no console Firebase. As callables de produção já são publicadas com enforcement e proteção contra replay.
- Restrinja a Firebase Web API key no Google Cloud às APIs e aos referrers realmente usados.
- Exija revisão de CODEOWNERS e os checks de dependency review, CodeQL, auditoria, testes e secret scan. Em repositório mantido por uma só pessoa, não torne a aprovação do próprio `CODEOWNERS` obrigatória até cadastrar um segundo mantenedor ou team confiável, pois o autor não pode aprovar a própria PR. O secret scan em CI ocorre depois do push; Secret Push Protection no GitHub continua obrigatório para impedir que um segredo vire objeto remoto.

O backend só aceita `APP_CHECK_ENFORCE=false` dentro do Firebase Functions Emulator; fora dele o enforcement e a proteção contra replay são obrigatórios. O workflow de produção falha antes do build se a site key não estiver configurada. Ele publica primeiro as Rules e índices que negam escritas legadas, depois Functions e, por último, o Hosting validado. Antes das Functions, confirme no console que todos os índices compostos terminaram de construir. Depois do Hosting, o workflow consulta a URL pública e confere os headers reais e o cache imutável dos assets; o emulador local valida somente o build e a configuração porque não reproduz esses headers.

## Provisionamento e rotação obrigatória das credenciais

O login legado não é aceito: nenhum documento `users/{uid}` pode manter `passwordHash`. Cada conta precisa de uma credencial segregada em `/_security/auth/credentialEntries/{uid}`, um `credentialId` novo e um usuário Firebase Auth sem e-mail, telefone, MFA ou provedor vinculado. As Rules e Functions também rejeitam sessões cujo `firebase.sign_in_provider` não seja `custom`.

Antes do deploy, faça um inventário administrativo de `uid`, login, workspace e role. Execute primeiro o dry-run e escolha exatamente um modo:

- `migrate-legacy`: root legado com hash, sem credencial segregada e sem usuário Auth;
- `create`: conta inteiramente nova;
- `rotate`: conta provisionada, ativa e íntegra;
- `reactivate`: conta provisionada que está fechada ou inconsistente e precisa de nova senha.

Se um processo morrer depois do staging, o lease expira em 15 minutos e o próximo `reactivate` reconhece somente o estado interrompido estritamente consistente. O dry-run informa que ele é recuperável; o `--apply` confirmado mantém Auth e Firestore fechados, encerra o staging e então faz a reativação com uma credencial nova. Qualquer binding divergente continua bloqueado para revisão administrativa.

Exemplo de migração de uma conta legada, com senha obtida de um secret provider e enviada por uma única linha de `stdin`:

```bash
cd functions
node scripts/provision-user-credential.js --project=controllstok --uid=UID --login=LOGIN_CANONICO --workspace=WORKSPACE_ID --role=ROLE --mode=migrate-legacy
secret-provider | node scripts/provision-user-credential.js --project=controllstok --uid=UID --login=LOGIN_CANONICO --workspace=WORKSPACE_ID --role=ROLE --mode=migrate-legacy --apply --password-stdin --confirm=controllstok/WORKSPACE_ID/UID/LOGIN_URL_ENCODED/ROLE/migrate-legacy
```

Sem `--password-stdin`, o comando `--apply` usa prompt TTY oculto e pede confirmação da senha. Nunca passe a senha como argumento, variável versionada ou arquivo dentro do repositório. A aplicação troca o `credentialId`, revoga refresh tokens, persiste claims exatas, remove o hash do root e deixa Firestore/Auth fechados se alguma etapa falhar. Depois de cada conta, audite novamente o root, a credencial, as claims, o status Auth e a role antes de liberar acesso.

## Migração obrigatória de cada workspace

As mutações no backend ficam bloqueadas até existir o marcador de migração do workspace. Execute em uma janela de manutenção, usando credenciais ADC administrativas e sem expor o arquivo de credenciais no repositório. Antes de aplicar, gere um export criptografado fora do repositório, teste a restauração em projeto isolado e registre responsável, janela, critério de abortar e rollback:

```bash
cd functions
node scripts/migrate-workspace-security.js --project=controllstok --workspace=WORKSPACE_ID
node scripts/migrate-workspace-security.js --project=controllstok --workspace=WORKSPACE_ID --apply --accept-inventory-baseline --confirm=controllstok/WORKSPACE_ID
```

O primeiro comando é sempre dry-run. Antes do segundo, confira o saldo atual de cada produto contra uma fonte administrativa: ele passa a ser o baseline explícito, e os movimentos anteriores ficam declarados como histórico não autoritativo. A aplicação valida campos críticos, imagens, colisões, referências e locks; usa lease exclusivo e só cria o marcador final depois da verificação. Repita para cada workspace.

## Política de visibilidade financeira

As Rules atuais permitem que `owner`, `admin`, `manager`, `member` e `viewer` leiam os documentos completos do próprio workspace. Como `products` e `movements` contêm custo e preço, todos esses papéis enxergam dados financeiros. Confirme formalmente essa política antes da produção. Se `member` ou `viewer` não puderem ver custos ou margens, separe esses campos em documentos privados; Firestore Rules não ocultam campos individuais de um documento autorizado para leitura.

## Gates locais

```bash
npm ci --ignore-scripts
npm ci --prefix functions --ignore-scripts
npm ci --prefix tools/firebase-cli --ignore-scripts
npm run security:audit
npm run lint
npm run build
npm run check --prefix functions
node tools/firebase-cli/run-firebase.cjs emulators:exec --only firestore,storage "npm run test:rules" --project demo-mystoreday-rules
node tools/firebase-cli/run-firebase.cjs emulators:exec --only auth,firestore,functions "npm run test:functions" --project demo-mystoreday-functions
node tools/firebase-cli/run-firebase.cjs emulators:exec --only firestore "npm run test:migration" --project demo-mystoreday-migration
node tools/firebase-cli/run-firebase.cjs emulators:exec --only auth,firestore "npm run test:provision" --project demo-mystoreday-provision
node tools/firebase-cli/run-firebase.cjs emulators:exec --only hosting "npm run test:hosting" --project demo-mystoreday-hosting
```

`npm run dev` conecta Auth, Firestore e Functions aos emuladores por padrão e falha se eles não estiverem ativos. Inicie-os explicitamente com a CLI isolada em `tools/firebase-cli` (`node tools/firebase-cli/run-firebase.cjs emulators:start --only auth,firestore,functions,storage --project demo-mystoreday-local`). O acesso local consciente à produção exige `VITE_ALLOW_PRODUCTION_FIREBASE=true` e não deve ser usado no desenvolvimento cotidiano.

As exceções temporárias do audit ficam em `security/npm-audit-allowlist.json`, exigem pacote e versão exatos e expiram em `2026-08-31`. Não prorrogue uma exceção sem nova análise do caminho afetado.
