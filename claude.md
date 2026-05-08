# SaaS Jurídico — Arquitetura Geral

## Visão Geral
Sistema jurídico completo para escritório único (sem multitenancy).
- **Monorepo**: `backend/` + `frontend/` + `database/` na raiz
- **Backend**: Fastify 4 + TypeScript + Zod (porta 3333)
- **Frontend**: Next.js 14 App Router + Tailwind CSS v4 + React Query
- **Banco**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (JWT) + middleware Next.js + middleware Fastify

## Regras Fundamentais
1. Frontend NUNCA faz query direta ao banco — sempre via API REST
2. Usuários NÃO se cadastram — apenas admin_global cria
3. Escritório único — sem multitenancy
4. IDs sempre UUID
5. Notificações internas (in-app), com possibilidade futura de externas
6. Backend em camadas: Controller → Service → Repository
7. Toda operação CRUD tem feedback visual (toast, skeleton, error state)

## Sistema de Permissões
Cada role tem permissões pré-definidas:
- **admin_global**: acesso total (CRUD em tudo, gerenciamento de usuários)
- **funcionario**: CRUD em clientes, processos, prazos, financeiro; leitura/atualização de notificações; SEM gerenciamento de usuários
- **cliente**: leitura dos próprios processos, prazos e notificações

## Fluxo de Autenticação
1. Login via Supabase Auth (`signInWithPassword`)
2. Frontend salva JWT em cookie
3. Middleware Next.js protege rotas `(dashboard)/*`
4. Backend valida JWT via Supabase Admin SDK em cada request
5. Backend injeta `request.user` com dados + role + permissões

## Convenções de Código
- **Backend**: camelCase para variáveis/funções, PascalCase para types/interfaces
- **Frontend**: componentes em PascalCase, hooks com prefixo `use`
- **Banco**: snake_case para tabelas e colunas
- **API**: endpoints em kebab-case, respostas em camelCase (transformação no repository)

## Deploy
- **Frontend**: Vercel
- **Backend**: Railway ou Render
- **Banco**: Supabase (PostgreSQL)
- **CORS**: configurado para aceitar origin do frontend

## Documentação Complementar
- `backend.md` — Detalhes do backend (endpoints, módulos, middlewares)
- `frontend.md` — Detalhes do frontend (páginas, componentes, hooks)
- `database.md` — Schema completo, queries, índices
