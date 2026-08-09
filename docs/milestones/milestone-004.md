# Milestone 004 — Institutional Home Experience

## Status
Concluído

## Objetivo

Reposicionar a Home principal do MyStoreDay como uma apresentação institucional da marca e do ecossistema de produtos, reduzindo a aparência de landing page SaaS tradicional e aproximando a experiência visual de produtos tecnológicos premium.

A nova Home passa a comunicar o MyStoreDay como uma plataforma que atende dois contextos principais de operação:

- MyStoreDay para Comércios
- MyStoreDay para Fornecedores

## Funcionalidades

- Criada nova Home institucional responsiva.
- Reestruturado o Hero principal com comunicação mais direta sobre o propósito da plataforma.
- Adicionado posicionamento do MyStoreDay como ecossistema de tecnologia.
- Criada apresentação dedicada do MyStoreDay para Comércios.
- Criada apresentação dedicada do MyStoreDay para Fornecedores.
- Adicionada representação visual do relacionamento entre operações e dados.
- Criada seção de produto em ação com dashboard ilustrativo.
- Criada seção editorial de princípios do produto.
- Criada escolha direta entre experiência para Comércio e Fornecedor.
- Mantidos acessos para login, aplicativo mobile, suporte e páginas legais.
- Mantido comportamento responsivo para desktop, tablet e mobile.

## UX / UI

- Removida a estrutura visual típica de landing page SaaS baseada em múltiplos cards pequenos.
- Adotada uma composição mais editorial e orientada a produto.
- Reduzido o excesso de elementos visuais concorrentes.
- Aumentado o uso de espaço negativo.
- Reforçada a hierarquia tipográfica do Hero.
- Separado visualmente o H1 em:
  - mensagem principal com maior peso e cor da marca;
  - complemento em tom neutro.
- Refinada a composição visual do Hero para equilibrar texto e representação do ecossistema.
- Mantido Header flutuante com efeito Liquid Glass discreto.
- Criadas product stories maiores para Comércio e Fornecedor.
- Simplificada a apresentação de funcionalidades para evitar excesso de checklists e cards.
- Adicionada seção escura para destacar visualmente o produto.
- Mantida identidade visual e paleta já existentes no Design System.

## Design System

- Reutilizados tokens oficiais de:
  - cores;
  - tipografia;
  - espaçamento;
  - radius;
  - motion.
- Mantida a fonte Manrope.
- Mantido uso das cores oficiais da marca.
- Evitada introdução de uma nova paleta paralela.
- Mantida compatibilidade com light mode e dark mode.
- Reutilizados ícones já disponíveis no projeto.

## Arquitetura

- Mantida a estrutura existente da aplicação.
- Não realizada refatoração estrutural fora do escopo da Home.
- Preservadas as rotas e integrações existentes.
- Alterações concentradas na camada de apresentação.
- Não adicionadas novas dependências.
- Mantida compatibilidade com React, TypeScript, Vite e React Router.

## Performance

- Evitadas novas bibliotecas visuais.
- Dashboard institucional implementado com HTML, CSS e SVG.
- Animações baseadas principalmente em `transform` e `opacity`.
- Mantido suporte a `prefers-reduced-motion`.
- Evitadas imagens externas e requisições adicionais para composição visual.
- Reduzido uso de efeitos visuais pesados e blur excessivo.

## Segurança

- Nenhuma regra crítica de negócio foi movida para o frontend.
- Nenhuma alteração realizada nas regras de autenticação ou autorização.
- Nenhum dado real de operação foi exposto na Home.
- Dashboard utilizado apenas como representação visual institucional.
- Nenhuma métrica pública fictícia foi apresentada como dado real da empresa.

## Acessibilidade

- Mantidos elementos semânticos como `header`, `main`, `section`, `nav`, `footer` e `article`.
- Mantidos estados `focus-visible`.
- Elementos decorativos tratados como não informativos para leitores de tela.
- Mantido suporte a redução de movimento.
- Preservada responsividade para diferentes tamanhos de tela.

## Resultado

A Home principal do MyStoreDay deixa de se comportar visualmente como uma landing page SaaS genérica e passa a funcionar como uma apresentação institucional da marca, das suas soluções e do seu ecossistema operacional.

O MyStoreDay passa a ser apresentado como uma plataforma tecnológica com experiências específicas para Comércios e Fornecedores, mantendo uma identidade visual única e consistente.
