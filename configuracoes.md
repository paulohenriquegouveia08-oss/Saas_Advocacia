# Página de Configurações — Sugestão de Implementação

## Visão Geral

Página destinada ao gerenciamento de configurações do sistema e perfil do usuário. Como o sistema é para escritório único (sem multitenancy), as configurações são globais ao sistema.

---

## Seções Sugeridas

### 1. Dados do Escritório

Configurações gerais do escritório de advocacia.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nome_escritorio | text | Nome do escritório |
| cnpj | text | CNPJ do escritório |
| telefone | text | Telefone de contato |
| email | email | Email de contato |
| endereco | text | Endereço completo |
| logo | image | Logo do escritório (opcional) |

**Permissão**: apenas `admin_global` pode editar.

---

### 2. Meu Perfil

Dados do usuário logado (disponível para todos os roles).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nome | text | Nome completo |
| email | text | Email (somente leitura - vem do Supabase Auth) |
| telefone | text | Telefone de contato |
| avatar | image | Foto de perfil (opcional) |
| nova_senha | password | Alterar senha |
| confirmar_senha | password | Confirmação de nova senha |

**Notas**:
- Alteração de senha via Supabase Auth (`updateUser`)
- Campos editáveis pelo próprio usuário

---

### 3. Gerenciamento de Usuários

Lista de usuários do sistema com ações de criar/editar/desativar.

| Ação | Descrição |
|------|-----------|
| listar | Tabela com nome, email, role, status |
| criar | Modal para criar novo usuário (admin_global) |
| editar | Editar nome, role (admin_global) |
| desativar | Desativar usuário (não deleta, só inativa) |

**Permissão**: apenas `admin_global`.

**Endpoints necessários**:
- GET /users (já existe)
- POST /users (já existe)
- PUT /users/:id (já existe)
- DELETE /users/:id (já existe - desativa)

---

### 4. Preferências do Sistema

Configurações de comportamento do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| notificar_prazo_vencido | boolean | Enviar notificação quando prazo vencer |
| notificar_prazo_proximo | boolean | Notificar X dias antes do vencimento |
| dias_antecedencia | number | Dias de antecedência para notificação (padrão: 7) |
| email_notificacoes | boolean | Enviar notificações por email (futuro) |

**Permissão**: `admin_global` e `funcionario`.

---

## Backend - Endpoints Necessários

### Settings (novo módulo)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | /settings | admin_global | Retorna configurações do escritório |
| PUT | /settings | admin_global | Atualiza configurações do escritório |
| GET | /settings/preferences | authenticated | Preferências do usuário |
| PUT | /settings/preferences | authenticated | Atualiza preferências do usuário |

### Estrutura do Módulo

```
backend/src/modules/settings/
├── settings.schema.ts
├── settings.repository.ts
├── settings.service.ts
├── settings.controller.ts
└── settings.routes.ts
```

---

## Frontend - Componentes

### Página: `/dashboard/configuracoes`

```
src/app/dashboard/configuracoes/page.tsx
```

**Layout**: Abas laterais ou tabs superiores:
- Escritório (ícone: building)
- Meu Perfil (ícone: user)
- Usuários (ícone: users) — só admin_global
- Preferências (ícone: settings)

**Padrões de UI**:
- Cards com formulários (React Hook Form + Zod)
- Toast de sucesso ao salvar
- Loading state durante submit
- Validação inline de campos

---

## Dados no Banco

### Tabela: settings

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | PK |
| escritorio_nome | TEXT | Nome do escritório |
| escritorio_cnpj | TEXT | CNPJ |
| escritorio_telefone | TEXT | Telefone |
| escritorio_email | TEXT | Email |
| escritorio_endereco | TEXT | Endereço |
| escritorio_logo | TEXT | URL do logo |
| notificar_prazo_vencido | BOOLEAN | Padrão: true |
| notificar_prazo_proximo | BOOLEAN | Padrão: true |
| dias_antecedencia | INT | Padrão: 7 |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### Tabela: user_preferences

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| user_id | UUID | FK users(id) |
| theme | TEXT | 'light' ou 'dark' (futuro) |
| notificacoes_email | BOOLEAN | Padrão: false |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## Observações

1. **Sem multitenancy**: configurações são globais, não por escritório
2. **Logo do escritório**: pode ser armazenado no Supabase Storage
3. **Futuro**: tema escuro (dark mode) quando Tailwind CSS v4 suportar nativamente
4. **Auditoria**: pode adicionar campo `updated_by` nas tabelas de settings para saber quem alterou