# Backend — Documentação Técnica

## Stack
- Node.js + TypeScript
- Fastify 4 (framework HTTP)
- Zod (validação)
- pg (node-postgres) para queries SQL
- @supabase/supabase-js (auth admin)
- node-cron (job de notificações)
- tsx (dev runner)

## Estrutura
```
backend/src/
├── config/          → env, database pool, supabase client, permissions
├── middlewares/     → auth (JWT), permission (role-based), error handler
├── utils/           → ApiError class
├── types/           → Fastify type augmentation
├── modules/
│   ├── users/       → CRUD + Supabase Auth integration
│   ├── clients/     → CRUD + busca por nome/CPF
│   ├── processes/   → CRUD + movements sub-resource
│   ├── deadlines/   → CRUD + urgência + auto-notificação
│   ├── notifications/ → list, read, read-all, unread-count
│   └── financial/   → CRUD + summary (totalizadores)
├── jobs/            → deadline-notifications cron
└── server.ts        → entrypoint
```

## Padrão de Módulo
Cada módulo contém 5 arquivos:
- `*.schema.ts` — Zod schemas (createSchema, updateSchema, querySchema)
- `*.repository.ts` — Queries SQL puras via pg Pool
- `*.service.ts` — Lógica de negócio, chama repository
- `*.controller.ts` — Extrai dados do request, chama service, envia response
- `*.routes.ts` — Registra rotas no Fastify, aplica middlewares

## Endpoints

### Users
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | /users | users:read | Lista usuários |
| GET | /users/:id | users:read | Detalhe do usuário |
| POST | /users | users:create | Cria usuário (Supabase Auth + tabela) |
| PUT | /users/:id | users:update | Atualiza usuário |
| DELETE | /users/:id | users:delete | Desativa usuário |

### Clients
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | /clients | clients:read | Lista (filtro nome/CPF) |
| GET | /clients/:id | clients:read | Detalhe + processos |
| POST | /clients | clients:create | Cria cliente |
| PUT | /clients/:id | clients:update | Atualiza cliente |
| DELETE | /clients/:id | clients:delete | Exclui (cascade) |

### Processes
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | /processes | processes:read | Lista (filtro status) |
| GET | /processes/:id | processes:read | Detalhe completo |
| POST | /processes | processes:create | Cria processo |
| PUT | /processes/:id | processes:update | Atualiza processo |
| DELETE | /processes/:id | processes:delete | Exclui (cascade) |
| GET | /processes/:id/movements | movements:read | Movimentações |
| POST | /processes/:id/movements | movements:create | Nova movimentação |

### Deadlines
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | /deadlines | deadlines:read | Lista ordenada urgência |
| GET | /deadlines/:id | deadlines:read | Detalhe |
| POST | /deadlines | deadlines:create | Cria + notifica responsável |
| PUT | /deadlines/:id | deadlines:update | Atualiza |
| DELETE | /deadlines/:id | deadlines:delete | Exclui |
| PATCH | /deadlines/:id/complete | deadlines:complete | Conclui prazo |

### Notifications
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | /notifications | notifications:read | Lista do usuário |
| PATCH | /notifications/:id/read | notifications:update | Marca como lida |
| PATCH | /notifications/read-all | notifications:update | Marca todas |
| GET | /notifications/unread-count | notifications:read | Contagem não lidas |

### Financial
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | /financial | financial:read | Lista transações |
| GET | /financial/summary | financial:read | Totalizadores |
| POST | /financial | financial:create | Cria transação |
| PUT | /financial/:id | financial:update | Atualiza |
| DELETE | /financial/:id | financial:delete | Exclui |

## Middleware Chain
```
Request → CORS → Auth (JWT validation) → Permission (role check) → Controller → Service → Repository → Response
```

## Error Handling
- `ApiError` class com statusCode + message
- Error handler global retorna `{ error: string, statusCode: number }`
- Erros de validação Zod retornam 400 com detalhes dos campos

## Sistema de Permissões (config/permissions.ts)
```
admin_global: ['*'] (acesso total)
funcionario: [clients, processes, movements, deadlines, notifications, financial] (sem users)
cliente: [processes:read, deadlines:read, notifications:read/update] (somente leitura)
```
