# Histórico de Correções de Deploy (Vercel + Supabase)

Este documento detalha os erros encontrados durante o processo de deploy e as implementações realizadas para garantir o funcionamento correto do SaaS Jurídico.

---

## 1. Erros de Build (TypeScript & React)

### ❌ Erro: "Property 'data' does not exist on type 'UserData'"
- **Causa**: O frontend tentava acessar `.data` em objetos de resposta que já haviam sido processados ou tinham tipagem incorreta.
- **Correção**: Padronização do `ApiClient` e das interfaces de retorno. Em locais específicos (como configurações de cargos), o wrapper `{ data: T }` foi restaurado onde o backend realmente o envia.

### ❌ Erro: "Calling setState synchronously within an effect"
- **Causa**: Violação das regras do React 19/Compiler no arquivo `configuracoes/page.tsx`. Atualizar o estado diretamente no `useEffect` causava loops de renderização.
- **Correção**: Refatoração para o padrão de "Ajuste de estado durante a renderização", comparando valores anteriores e atuais para disparar o `setForm` sem disparar efeitos em cascata.

### ❌ Erro: "Variable 'env' implicitly has type 'any'"
- **Causa**: Tentativa de adicionar logs de erro no `env.ts` que quebrou a exportação tipada do Zod.
- **Correção**: Restauração da exportação direta `export const env = envSchema.parse(process.env)`, garantindo que o TypeScript reconheça as propriedades em todo o backend.

---

## 2. Erros de Comunicação (Frontend → Backend)

### ❌ Erro: `net::ERR_CONNECTION_REFUSED` (localhost:3333)
- **Causa**: O frontend estava configurado com o fallback de API para `localhost:3333`. Em produção, as variáveis de ambiente do Next.js são "congeladas" no build, ignorando falhas de conexão.
- **Correção**: Implementação de detecção dinâmica no `frontend/src/lib/api.ts`. O sistema agora detecta se está rodando no navegador e fora de localhost, forçando o uso do prefixo relativo `/api` (Vercel Services).

### ❌ Erro: HTTP 404/500 nas rotas `/api/*`
- **Causa**: Conflito de roteamento. O backend não estava preparado para receber o prefixo `/api` em suas rotas internas.
- **Correção**: Adição de um `default export` no `backend/src/server.ts` que funciona como o handler da Vercel, emitindo o evento de request corretamente para o Fastify.

---

## 3. Erros de Infraestrutura (Backend & Banco de Dados)

### ❌ Erro: `getaddrinfo ENOTFOUND db.tytodqltbcaqivtjgiwq.supabase.co`
- **Causa**: A Vercel (ambiente serverless) tem dificuldade em resolver DNS de conexão direta do Postgres (porta 5432) e muitas vezes essas conexões são bloqueadas.
- **Correção**: Migração para o **Supabase Connection Pooler**.
    - **URL alterada**: De `db.xxx.supabase.co:5432` para `aws-1-xxx.pooler.supabase.com:6543`.
    - **Modo**: Transaction mode.
    - **SSL**: Habilitado obrigatoriamente via código no `database.ts` para produção (`rejectUnauthorized: false`).

### ❌ Erro: 500 Interno (Timeout/Crash)
- **Causa**: O `node-cron` iniciava processos em background que a Vercel tentava manter vivos, causando instabilidade na função serverless.
- **Correção**: Adicionada trava condicional no `server.ts` para **não** iniciar o cron job se detectar ambiente `VERCEL` ou `AWS_LAMBDA`.

---

## 4. Configurações Obrigatórias no Painel Vercel

Para que o sistema funcione, as seguintes Environment Variables **DEVEM** estar no painel da Vercel:

- `DATABASE_URL`: Link do Pooler (porta 6543) com `?pgbouncer=true`.
- `SUPABASE_URL`: URL do projeto Supabase.
- `SUPABASE_ANON_KEY`: Chave anônima.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (para bypass de RLS no backend).
- `NODE_ENV`: Deve ser `production`.

---
*Este arquivo deve ser atualizado sempre que uma mudança estrutural de infraestrutura for realizada.*
