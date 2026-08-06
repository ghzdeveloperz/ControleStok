# Milestone 001 — Autenticação e App Check Web

## Funcionalidades
- Integrado Firebase App Check com reCAPTCHA Enterprise.
- Implementado login Web com Firebase Authentication por e-mail e senha.
- Adicionada restauração automática da sessão.
- Implementada resolução da empresa ativa pelo UID autenticado.
- Liberado o acesso ao estoque para contas comerciais válidas.

## Melhorias Técnicas
- Removida a dependência da Function inexistente `loginWithPassword`.
- Removido o fluxo de Custom Token.
- Alinhada a autenticação Web com o aplicativo mobile.
- Adicionadas validações de e-mail verificado, conta ativa e workspace.
- Corrigida a tipagem compatível com `erasableSyntaxOnly`.

## Segurança
- App Check inicializado antes dos serviços Firebase.
- Debug Provider limitado ao ambiente local.
- Senhas e tokens não são armazenados manualmente pelo frontend.
- Sessões inválidas são encerradas automaticamente.

## Correções
- Corrigido erro de CORS no login.
- Corrigidos erros `401` e `403` relacionados ao App Check.
- Corrigido redirecionamento para o estoque após autenticação válida.
