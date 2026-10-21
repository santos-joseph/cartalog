# Cartalog Web

Frontend Next.js 16 do Cartalog. A raiz `localhost:3000` abre a landing institucional com o formulário de demonstração. O login fica em `/login`; o catálogo público, em `{slug}.localhost:3000` no desenvolvimento.

## Escopo

- Dono (`OWNER`): visão geral, veículos e acompanhamento/distribuição de leads.
- Vendedor (`SELLER`): fila geral, seus leads e atendimento.
- Visitante: catálogo público, páginas publicadas da loja e formulário de contato.

A equipe Cartalog cria a empresa após receber o pedido de demonstração. Cadastro de vendedores, configurações e construção de páginas pertencem ao aplicativo desktop. Veículos podem ser cadastrados no desktop e na web.

## Desenvolvimento

1. Inicie a API e o PostgreSQL seguindo o [README principal](../README.md).
2. Crie `.env.local` com `NEXT_PUBLIC_API_URL=http://localhost:3333` e `NEXT_PUBLIC_BASE_DOMAIN=localhost`.
3. Execute `npm ci` e `npm run dev`.

Acesse `http://localhost:3000/login`. O seed da API cria a loja `demo-motors` com acesso de demonstração descrito no próprio script `api/prisma/seed.ts`.
