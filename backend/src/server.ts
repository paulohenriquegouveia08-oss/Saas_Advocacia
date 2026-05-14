import Fastify from 'fastify'
import type { IncomingMessage, ServerResponse } from 'http'
import cors from '@fastify/cors'
import { env } from './config/env'
import { errorHandler } from './middlewares/error-handler.middleware'
import { userRoutes } from './modules/users/user.routes'
import { clientRoutes } from './modules/clients/client.routes'
import { processRoutes } from './modules/processes/process.routes'
import { deadlineRoutes } from './modules/deadlines/deadline.routes'
import { notificationRoutes } from './modules/notifications/notification.routes'
import { financialRoutes } from './modules/financial/financial.routes'
import { settingsRoutes } from './modules/settings/settings.routes'
import { rolesRoutes } from './modules/roles/roles.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { startDeadlineNotificationJob } from './jobs/deadline-notifications.job'
import { pool } from './config/database'

export async function createApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  })

  // CORS
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? true : env.CORS_ORIGIN,
    credentials: true,
  })

  // Global error handler
  app.setErrorHandler(errorHandler)

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  

  // Setup de tabelas de roles e permissions (executar uma vez)
  app.post('/setup/roles', async (request, reply) => {
    const { pool } = await import('./config/database')

    try {
      // Verificar se já existe
      const exists = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'permissions' LIMIT 1
      `)
      if (exists.rows.length > 0) {
        return reply.send({ message: 'Tabelas de roles já existem' })
      }

      // Criar roles
      await pool.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          nome TEXT UNIQUE NOT NULL,
          descricao TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)

      // Criar permissions
      await pool.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          nome TEXT NOT NULL,
          chave TEXT UNIQUE NOT NULL,
          grupo TEXT NOT NULL
        )
      `)

      // Criar user_roles
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_roles (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, role_id)
        )
      `)

      // Criar role_permissions
      await pool.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          PRIMARY KEY (role_id, permission_id)
        )
      `)

      // Inserir permissions padrão
      await pool.query(`
        INSERT INTO permissions (nome, chave, grupo) VALUES
        ('Criar usuários', 'users:create', 'Usuários'),
        ('Listar usuários', 'users:read', 'Usuários'),
        ('Editar usuários', 'users:update', 'Usuários'),
        ('Excluir usuários', 'users:delete', 'Usuários'),
        ('Criar clientes', 'clients:create', 'Clientes'),
        ('Listar clientes', 'clients:read', 'Clientes'),
        ('Editar clientes', 'clients:update', 'Clientes'),
        ('Excluir clientes', 'clients:delete', 'Clientes'),
        ('Criar processos', 'processes:create', 'Processos'),
        ('Listar processos', 'processes:read', 'Processos'),
        ('Editar processos', 'processes:update', 'Processos'),
        ('Excluir processos', 'processes:delete', 'Processos'),
        ('Criar movimentos', 'movements:create', 'Movimentos'),
        ('Listar movimentos', 'movements:read', 'Movimentos'),
        ('Criar prazos', 'deadlines:create', 'Prazos'),
        ('Listar prazos', 'deadlines:read', 'Prazos'),
        ('Editar prazos', 'deadlines:update', 'Prazos'),
        ('Excluir prazos', 'deadlines:delete', 'Prazos'),
        ('Concluir prazos', 'deadlines:complete', 'Prazos'),
        ('Listar notificações', 'notifications:read', 'Notificações'),
        ('Atualizar notificações', 'notifications:update', 'Notificações'),
        ('Criar transação', 'financial:create', 'Financeiro'),
        ('Listar transações', 'financial:read', 'Financeiro'),
        ('Editar transação', 'financial:update', 'Financeiro'),
        ('Excluir transação', 'financial:delete', 'Financeiro'),
        ('Ver configurações', 'settings:read', 'Configurações'),
        ('Editar configurações', 'settings:update', 'Configurações')
        ON CONFLICT (chave) DO NOTHING
      `)

      // Inserir roles padrão
      await pool.query(`
        INSERT INTO roles (nome, descricao) VALUES
        ('admin_global', 'Acesso total ao sistema'),
        ('funcionario', 'Acesso limitado sem gerenciamento de usuários'),
        ('cliente', 'Acesso apenas para visualizar seus processos e prazos')
        ON CONFLICT (nome) DO NOTHING
      `)

      // Vincular todas permissões ao admin_global
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p WHERE r.nome = 'admin_global'
        ON CONFLICT DO NOTHING
      `)

      // Vincular permissões de funcionário
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p 
        WHERE r.nome = 'funcionario' AND p.chave IN (
          'clients:create', 'clients:read', 'clients:update',
          'processes:create', 'processes:read', 'processes:update',
          'movements:create', 'movements:read',
          'deadlines:create', 'deadlines:read', 'deadlines:update', 'deadlines:complete',
          'notifications:read', 'notifications:update',
          'financial:create', 'financial:read', 'financial:update'
        )
        ON CONFLICT DO NOTHING
      `)

      // Vincular permissões de cliente
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM roles r, permissions p 
        WHERE r.nome = 'cliente' AND p.chave IN (
          'processes:read', 'deadlines:read', 'notifications:read'
        )
        ON CONFLICT DO NOTHING
      `)

      return reply.status(201).send({ message: 'Tabelas de roles e permissions criadas com sucesso!' })
    } catch (error) {
      console.error('Erro ao criar tabelas:', error)
      return reply.status(500).send({ error: 'Erro ao criar tabelas', details: String(error) })
    }
  })

  // Fix: vincular usuários existentes que não têm user_roles
  app.post('/setup/fix-user-roles', async (request, reply) => {
    const { pool } = await import('./config/database')

    try {
      // Buscar usuários sem vínculo em user_roles
      const result = await pool.query(`
        INSERT INTO user_roles (user_id, role_id)
        SELECT u.id, r.id
        FROM users u
        JOIN roles r ON r.nome = u.role::text
        WHERE NOT EXISTS (
          SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id
        )
        RETURNING user_id
      `)

      return reply.send({ 
        message: `${result.rowCount} usuários vinculados aos seus cargos`,
        fixed: result.rowCount
      })
    } catch (error) {
      console.error('Erro ao corrigir user_roles:', error)
      return reply.status(500).send({ error: 'Erro ao corrigir', details: String(error) })
    }
  })

  // Setup inicial - cria primeiro admin (só funciona se não existir nenhum usuário)
  app.post('/setup', async (request, reply) => {
    const { queryCount } = await import('./config/database')
    const { UserRepository } = await import('./modules/users/user.repository')
    const { supabaseAdmin } = await import('./config/supabase')
    const { createUserSchema } = await import('./modules/users/user.schema')

    const totalUsers = await queryCount('SELECT COUNT(*) FROM users')

    if (totalUsers > 0) {
      return reply.status(403).send({ error: 'Setup já foi executado', statusCode: 403 })
    }

    const data = createUserSchema.parse(request.body)

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return reply.status(500).send({ error: `Erro ao criar usuário: ${authError?.message}`, statusCode: 500 })
    }

    const userRepo = new UserRepository()
    const user = await userRepo.create({
      id: authData.user.id,
      nome: data.nome,
      email: data.email,
      role: data.role,
    })

    return reply.status(201).send(user)
  })

  // Seed - cria dados iniciais para teste (cliente + processo + prazo)
  app.post('/seed', async (request, reply) => {
    const { pool } = await import('./config/database')
    const { queryOne } = await import('./config/database')

    // Verificar se já tem dados
    const existingClient = await queryOne<{ id: string }>('SELECT id FROM clients LIMIT 1')
    if (existingClient) {
      return reply.status(400).send({ error: 'Seed já executado', statusCode: 400 })
    }

    // Criar cliente
    const client = await queryOne<{ id: string }>(
      'INSERT INTO clients (nome, cpf, telefone, email) VALUES ($1, $2, $3, $4) RETURNING id',
      ['João Silva', '123.456.789-00', '(11) 99999-9999', 'joao@email.com']
    )

    // Criar processo
    const processo = await queryOne<{ id: string }>(
      'INSERT INTO processes (client_id, numero, tribunal, tipo_acao, parte_contraria) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [client!.id, '1001234-55.2026.8.26.0103', 'TJSP', 'Cível', 'Empresa XYZ Ltda']
    )

    // Criar prazo
    const dataVenc = new Date()
    dataVenc.setDate(dataVenc.getDate() + 7)
    await pool.query(
      'INSERT INTO deadlines (process_id, descricao, data_vencimento) VALUES ($1, $2, $3)',
      [processo!.id, 'Apresentar contestação', dataVenc.toISOString().split('T')[0]]
    )

    return reply.status(201).send({ message: 'Seed criado com sucesso', client, processo })
  })

  // Dashboard stats endpoint (public after auth)
  app.get('/dashboard/stats', {
    preHandler: [
      async (request, reply) => {
        const { authMiddleware } = await import('./middlewares/auth.middleware')
        await authMiddleware(request, reply)
      },
    ],
  }, async (request, reply) => {
    const { queryOne, queryCount } = await import('./config/database')
    const { DeadlineRepository } = await import('./modules/deadlines/deadline.repository')
    const { NotificationRepository } = await import('./modules/notifications/notification.repository')

    const deadlineRepo = new DeadlineRepository()
    const notificationRepo = new NotificationRepository()

    const processosAtivos = await queryCount(
      "SELECT COUNT(*) FROM processes WHERE status = 'ativo'"
    )

    const prazosHoje = await queryCount(
      "SELECT COUNT(*) FROM deadlines WHERE data_vencimento = CURRENT_DATE AND status != 'concluido'"
    )

    const prazosCriticos = await queryCount(
      "SELECT COUNT(*) FROM deadlines WHERE data_vencimento <= CURRENT_DATE + 3 AND data_vencimento >= CURRENT_DATE AND status != 'concluido'"
    )

    const notificacoesNaoLidas = await notificationRepo.getUnreadCount(request.user!.id)
    const prazosUrgentes = await deadlineRepo.findTopUrgent(5)

    return reply.send({
      processos_ativos: processosAtivos,
      prazos_hoje: prazosHoje,
      prazos_criticos: prazosCriticos,
      notificacoes_nao_lidas: notificacoesNaoLidas,
      prazos_urgentes: prazosUrgentes,
    })
  })

  // Register module routes

  await app.register(userRoutes)
  await app.register(clientRoutes)
  await app.register(processRoutes)
  await app.register(deadlineRoutes)
  await app.register(notificationRoutes)
  await app.register(financialRoutes)
  await app.register(settingsRoutes)
  await app.register(rolesRoutes, { prefix: '/roles' })
  await app.register(authRoutes)

  // Start notification cron job (apenas em servidor persistente, não em serverless)
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME
  if (!isServerless) {
    startDeadlineNotificationJob()
    app.log.info('✅ Cron job de notificações iniciado')
  } else {
    app.log.info('⏭️ Cron job ignorado (ambiente serverless)')
  }

  // Verify database connection
  try {
    await pool.query('SELECT 1')
    app.log.info('✅ Conexão com banco de dados estabelecida')
  } catch (error) {
    app.log.error(error as Error, '❌ Erro ao conectar com banco de dados')
  }

  return app
}

// ============================================================
// Vercel experimentalServices: default export como handler
// ============================================================
let cachedApp: Awaited<ReturnType<typeof createApp>> | null = null

async function getApp() {
  if (!cachedApp) {
    cachedApp = await createApp()
    await cachedApp.ready()
    console.log('[Vercel] Fastify app pronto')
  }
  return cachedApp
}

// Default export que a Vercel espera: (req, res) => void
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp()
    app.server.emit('request', req, res)
  } catch (err) {
    console.error('[Vercel] Erro no handler:', err)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Erro interno do servidor', statusCode: 500 }))
  }
}

// Inicia o servidor apenas se executado diretamente (desenvolvimento local)
if (require.main === module) {
  async function start() {
    const app = await createApp()
    try {
      await app.listen({ port: env.PORT, host: env.HOST })
      console.log(`🚀 Servidor rodando em http://${env.HOST}:${env.PORT}`)
    } catch (err) {
      app.log.error(err)
      process.exit(1)
    }

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'] as const
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, shutting down...`)
        await app.close()
        await pool.end()
        process.exit(0)
      })
    })
  }

  start()
}
