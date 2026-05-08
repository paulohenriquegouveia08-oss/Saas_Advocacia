# Frontend — Documentação Técnica

## Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS v4
- React Query (TanStack Query) — cache, loading, error states
- React Hook Form + Zod — formulários com validação inline

## Estrutura
```
frontend/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Sidebar + Topbar
│   │   ├── page.tsx                ← Dashboard home
│   │   ├── clientes/
│   │   ├── processos/
│   │   ├── prazos/
│   │   ├── financeiro/
│   │   └── notificacoes/
│   ├── layout.tsx                  ← Root layout (providers)
│   └── globals.css
├── components/
│   ├── ui/         → Button, Input, Badge, Modal, Toast, UrgenciaBadge, StatusBadge
│   ├── layout/     → Sidebar, Topbar, PageHeader
│   └── shared/     → DataTable, TableSkeleton, ErrorState, EmptyState, Pagination
├── hooks/          → useClientes, useProcessos, usePrazos, useFinanceiro, useNotificacoes, useAuth
├── lib/            → api.ts (HTTP client), auth.ts, toast.ts, utils.ts
├── providers/      → QueryProvider.tsx
├── types/          → client.ts, process.ts, deadline.ts, notification.ts, financial.ts, user.ts
└── middleware.ts   → Proteção de rotas (redirect /login)
```

## Padrão de Listagem (todas as páginas)
```
isLoading  → <TableSkeleton rows={5} />
isError    → <ErrorState message="..." onRetry={refetch} />
!data.length → <EmptyState message="..." />
data       → <DataTable data={data} />
```

## Padrão CRUD
- **Create/Edit**: Modal com React Hook Form + Zod, submit disabled + spinner
- **Delete**: ConfirmModal, DELETE via API, toast de confirmação
- **Toast**: success (verde), error (vermelho), info (azul) — auto-remove 3s

## Badges de Urgência (Prazos)
| Categoria | Cor | Condição |
|-----------|-----|----------|
| vencido | vermelho | data < hoje |
| vence_hoje | laranja | data = hoje |
| critico | vermelho claro | data <= hoje+3 |
| urgente | amarelo | data <= hoje+7 |
| proximo | azul | data <= hoje+30 |
| normal | cinza | data > hoje+30 |

## Status Badges
- Processos: ativo→verde, suspenso→amarelo, encerrado→cinza
- Prazos: pendente→azul, atrasado→vermelho, concluido→verde
- Financeiro: entrada→verde(+), saida→vermelho(-)

## Notificações na Topbar
- Badge vermelho no ícone de sino
- Consulta GET /notifications/unread-count a cada 60s
- Exibe "9+" se count > 9

## Autenticação
- Login via Supabase Auth (signInWithPassword)
- Token salvo em cookie httpOnly
- middleware.ts intercepta rotas (dashboard)/* e redireciona para /login se sem token
- lib/api.ts injeta Authorization header em todas as requests

## Páginas Principais
1. **Dashboard**: Cards resumo + 5 prazos urgentes
2. **Clientes**: Tabela + busca nome/CPF + detalhe com processos
3. **Processos**: Tabela + filtro status + detalhe com abas (movimentações, prazos, financeiro)
4. **Prazos**: Tabela ordenada urgência + badges + linhas destacadas
5. **Financeiro**: Tabela + chips tipo + totalizadores (entradas, saídas, saldo)
6. **Notificações**: Lista com destaque não lidas + marcar todas como lidas
