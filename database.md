# Database — Documentação Técnica

## Banco: PostgreSQL (Supabase)

## Tabelas e Relacionamentos
```
users (1) ←── (N) deadlines.responsavel_id
users (1) ←── (N) notifications.user_id
clients (1) ←── (N) processes.client_id
clients (1) ←── (N) financial_transactions.client_id
processes (1) ←── (N) process_movements.process_id
processes (1) ←── (N) deadlines.process_id
deadlines (1) ←── (N) notifications.deadline_id
```

## Enums
- `user_role`: admin_global, funcionario, cliente
- `process_status`: ativo, suspenso, encerrado
- `deadline_status`: pendente, atrasado, concluido
- `financial_type`: entrada, saida
- `notification_type`: prazo_proximo, prazo_vencido, geral

## Tabelas

### users
| Coluna | Tipo | Constraint |
|--------|------|------------|
| id | UUID | PK (= auth.users.id) |
| nome | TEXT | NOT NULL |
| email | TEXT | UNIQUE NOT NULL |
| role | user_role | NOT NULL |
| ativo | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | DEFAULT NOW() |

### clients
| Coluna | Tipo | Constraint |
|--------|------|------------|
| id | UUID | PK DEFAULT uuid_generate_v4() |
| nome | TEXT | NOT NULL |
| cpf | TEXT | - |
| telefone | TEXT | - |
| email | TEXT | - |
| status | TEXT | - |
| created_at | TIMESTAMP | DEFAULT NOW() |

### processes
| Coluna | Tipo | Constraint |
|--------|------|------------|
| id | UUID | PK DEFAULT uuid_generate_v4() |
| client_id | UUID | FK clients(id) CASCADE |
| numero | TEXT | UNIQUE NOT NULL |
| tribunal | TEXT | - |
| tipo_acao | TEXT | - |
| parte_contraria | TEXT | - |
| status | process_status | DEFAULT 'ativo' |
| created_at | TIMESTAMP | DEFAULT NOW() |

### process_movements
| Coluna | Tipo | Constraint |
|--------|------|------------|
| id | UUID | PK DEFAULT uuid_generate_v4() |
| process_id | UUID | FK processes(id) CASCADE |
| tipo | TEXT | - |
| descricao | TEXT | - |
| data | TIMESTAMP | - |
| created_at | TIMESTAMP | DEFAULT NOW() |

### deadlines
| Coluna | Tipo | Constraint |
|--------|------|------------|
| id | UUID | PK DEFAULT uuid_generate_v4() |
| process_id | UUID | FK processes(id) CASCADE |
| descricao | TEXT | - |
| data_inicio | DATE | - |
| data_vencimento | DATE | NOT NULL |
| status | deadline_status | DEFAULT 'pendente' |
| responsavel_id | UUID | FK users(id) |
| dias_restantes | INT | GENERATED ALWAYS |

### notifications
| Coluna | Tipo | Constraint |
|--------|------|------------|
| id | UUID | PK DEFAULT uuid_generate_v4() |
| deadline_id | UUID | FK deadlines(id) CASCADE |
| user_id | UUID | FK users(id) CASCADE |
| tipo | notification_type | NOT NULL |
| mensagem | TEXT | NOT NULL |
| lida | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | DEFAULT NOW() |

### financial_transactions
| Coluna | Tipo | Constraint |
|--------|------|------------|
| id | UUID | PK DEFAULT uuid_generate_v4() |
| tipo | financial_type | - |
| descricao | TEXT | - |
| valor | NUMERIC | NOT NULL |
| categoria | TEXT | - |
| status | TEXT | - |
| data | DATE | - |
| client_id | UUID | FK clients(id) |

## Índices
- `idx_deadlines_vencimento` → deadlines(data_vencimento ASC)
- `idx_deadlines_status` → deadlines(status)
- `idx_notifications_user` → notifications(user_id, lida)

## Query de Prazos com Urgência
```sql
SELECT d.*, p.numero AS processo_numero, c.nome AS cliente_nome,
  CASE
    WHEN data_vencimento < CURRENT_DATE     THEN 'vencido'
    WHEN data_vencimento = CURRENT_DATE     THEN 'vence_hoje'
    WHEN data_vencimento <= CURRENT_DATE+3  THEN 'critico'
    WHEN data_vencimento <= CURRENT_DATE+7  THEN 'urgente'
    WHEN data_vencimento <= CURRENT_DATE+30 THEN 'proximo'
    ELSE 'normal'
  END AS urgencia,
  (data_vencimento - CURRENT_DATE) AS dias_restantes
FROM deadlines d
JOIN processes p ON d.process_id = p.id
JOIN clients c ON p.client_id = c.id
WHERE d.status != 'concluido'
ORDER BY data_vencimento ASC;
```

## Cascades
- Excluir client → exclui processes → exclui deadlines + movements → exclui notifications
- Excluir process → exclui deadlines + movements → exclui notifications
- Excluir deadline → exclui notifications
