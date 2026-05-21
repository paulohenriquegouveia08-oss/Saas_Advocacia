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
import { scheduleRoutes } from './modules/schedule/schedule.routes'
import { startDeadlineNotificationJob } from './jobs/deadline-notifications.job'
import { supabaseAdmin } from './config/supabase'

export async function createApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  })

  await app.register(cors, {
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.setErrorHandler(errorHandler)

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  // Setup de tabelas de roles e permissions (executar uma vez via Supabase SQL Editor)
  app.post('/setup/roles', async (request, reply) => {
    try {
      const { data: exists } = await supabaseAdmin
        .from('permissions')
        .select('id')
        .limit(1)

      if (exists && exists.length > 0) {
        return reply.send({ message: 'Tabelas de roles já existem' })
      }

      return reply.status(500).send({
        error: 'Tabelas não existem. Execute o SQL de setup via Supabase SQL Editor.',
        sql: `
          CREATE TABLE IF NOT EXISTS roles (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT UNIQUE NOT NULL, descricao TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
          CREATE TABLE IF NOT EXISTS permissions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, chave TEXT UNIQUE NOT NULL, grupo TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS user_roles (user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE, PRIMARY KEY (user_id, role_id));
          CREATE TABLE IF NOT EXISTS role_permissions (role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE, permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE, PRIMARY KEY (role_id, permission_id));
          INSERT INTO permissions (nome, chave, grupo) VALUES ('Criar usuários', 'users:create', 'Usuários'), ('Listar usuários', 'users:read', 'Usuários'), ('Editar usuários', 'users:update', 'Usuários'), ('Excluir usuários', 'users:delete', 'Usuários'), ('Criar clientes', 'clients:create', 'Clientes'), ('Listar clientes', 'clients:read', 'Clientes'), ('Editar clientes', 'clients:update', 'Clientes'), ('Excluir clientes', 'clients:delete', 'Clientes'), ('Criar processos', 'processes:create', 'Processos'), ('Listar processos', 'processes:read', 'Processos'), ('Editar processos', 'processes:update', 'Processos'), ('Excluir processos', 'processes:delete', 'Processos'), ('Criar movimentos', 'movements:create', 'Movimentos'), ('Listar movimentos', 'movements:read', 'Movimentos'), ('Criar prazos', 'deadlines:create', 'Prazos'), ('Listar prazos', 'deadlines:read', 'Prazos'), ('Editar prazos', 'deadlines:update', 'Prazos'), ('Excluir prazos', 'deadlines:delete', 'Prazos'), ('Concluir prazos', 'deadlines:complete', 'Prazos'), ('Listar notificações', 'notifications:read', 'Notificações'), ('Atualizar notificações', 'notifications:update', 'Notificações'), ('Criar transação', 'financial:create', 'Financeiro'), ('Listar transações', 'financial:read', 'Financeiro'), ('Editar transação', 'financial:update', 'Financeiro'), ('Excluir transação', 'financial:delete', 'Financeiro'), ('Ver configurações', 'settings:read', 'Configurações'), ('Editar configurações', 'settings:update', 'Configurações') ON CONFLICT (chave) DO NOTHING;
          INSERT INTO roles (nome, descricao) VALUES ('admin_global', 'Acesso total ao sistema'), ('funcionario', 'Acesso limitado sem gerenciamento de usuários'), ('cliente', 'Acesso apenas para visualizar seus processos e prazos') ON CONFLICT (nome) DO NOTHING;
          INSERT INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.nome = 'admin_global' ON CONFLICT DO NOTHING;
          INSERT INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.nome = 'funcionario' AND p.chave IN ('clients:create', 'clients:read', 'clients:update', 'processes:create', 'processes:read', 'processes:update', 'movements:create', 'movements:read', 'deadlines:create', 'deadlines:read', 'deadlines:update', 'deadlines:complete', 'notifications:read', 'notifications:update', 'financial:create', 'financial:read', 'financial:update') ON CONFLICT DO NOTHING;
          INSERT INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.nome = 'cliente' AND p.chave IN ('processes:read', 'deadlines:read', 'notifications:read') ON CONFLICT DO NOTHING;
        `,
      })
    } catch (error) {
      console.error('Erro ao verificar tabelas:', error)
      return reply.status(500).send({ error: 'Erro ao verificar tabelas', details: String(error) })
    }
  })

  // Fix: vincular usuários existentes que não têm user_roles
  app.post('/setup/fix-user-roles', async (request, reply) => {
    try {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, role')

      if (!users || users.length === 0) {
        return reply.send({ message: 'Nenhum usuário para corrigir', fixed: 0 })
      }

      const { data: roles } = await supabaseAdmin
        .from('roles')
        .select('id, nome')

      if (!roles) {
        return reply.status(500).send({ error: 'Roles não encontradas' })
      }

      const roleMap: Record<string, string> = {}
      for (const r of roles) roleMap[r.nome] = r.id

      const { data: existingLinks } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')

      const linkedUserIds = new Set(existingLinks?.map(l => l.user_id) || [])

      let fixed = 0
      for (const user of users) {
        if (!linkedUserIds.has(user.id) && roleMap[user.role]) {
          await supabaseAdmin
            .from('user_roles')
            .insert({ user_id: user.id, role_id: roleMap[user.role] })
          fixed++
        }
      }

      return reply.send({ message: `${fixed} usuários vinculados aos seus cargos`, fixed })
    } catch (error) {
      console.error('Erro ao corrigir user_roles:', error)
      return reply.status(500).send({ error: 'Erro ao corrigir', details: String(error) })
    }
  })

  // Setup inicial - cria primeiro admin
  app.post('/setup', async (request, reply) => {
    const { UserRepository } = await import('./modules/users/user.repository')
    const { createUserSchema } = await import('./modules/users/user.schema')

    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if ((totalUsers || 0) > 0) {
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

  // Seed - cria dados iniciais para teste
  app.post('/seed', async (request, reply) => {
    const { ClientRepository } = await import('./modules/clients/client.repository')
    const { ProcessRepository } = await import('./modules/processes/process.repository')
    const { DeadlineRepository } = await import('./modules/deadlines/deadline.repository')

    const clientRepo = new ClientRepository()
    const { data: existingClient } = await supabaseAdmin.from('clients').select('id').limit(1)
    if (existingClient && existingClient.length > 0) {
      return reply.status(400).send({ error: 'Seed já executado', statusCode: 400 })
    }

    const client = await clientRepo.create({
      nome: 'João Silva',
      cpf: '123.456.789-00',
      telefone: '(11) 99999-9999',
      email: 'joao@email.com',
    })

    const processRepo = new ProcessRepository()
    const processo = await processRepo.create({
      client_id: client.id,
      numero: '1001234-55.2026.8.26.0103',
      tribunal: 'TJSP',
      tipo_acao: 'Cível',
      parte_contraria: 'Empresa XYZ Ltda',
    })

    const deadlineRepo = new DeadlineRepository()
    const dataVenc = new Date()
    dataVenc.setDate(dataVenc.getDate() + 7)
    await deadlineRepo.create({
      process_id: processo.id,
      descricao: 'Apresentar contestação',
      data_vencimento: dataVenc.toISOString().split('T')[0],
    })

    return reply.status(201).send({ message: 'Seed criado com sucesso', client, processo })
  })

  // Dashboard stats endpoint
  app.get('/dashboard/stats', {
    preHandler: [
      async (request, reply) => {
        const { authMiddleware } = await import('./middlewares/auth.middleware')
        await authMiddleware(request, reply)
      },
    ],
  }, async (request, reply) => {
    const { DeadlineRepository } = await import('./modules/deadlines/deadline.repository')
    const { NotificationRepository } = await import('./modules/notifications/notification.repository')

    const deadlineRepo = new DeadlineRepository()
    const notificationRepo = new NotificationRepository()

    const { count: processosAtivos } = await supabaseAdmin
      .from('processes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo')

    const today = new Date().toISOString().split('T')[0]
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { count: prazosHoje } = await supabaseAdmin
      .from('deadlines')
      .select('*', { count: 'exact', head: true })
      .eq('data_vencimento', today)
      .neq('status', 'concluido')

    const { count: prazosCriticos } = await supabaseAdmin
      .from('deadlines')
      .select('*', { count: 'exact', head: true })
      .gte('data_vencimento', today)
      .lte('data_vencimento', threeDaysFromNow)
      .neq('status', 'concluido')

    const notificacoesNaoLidas = await notificationRepo.getUnreadCount(request.user!.id)
    const prazosUrgentes = await deadlineRepo.findTopUrgent(5)

    return reply.send({
      processos_ativos: processosAtivos || 0,
      prazos_hoje: prazosHoje || 0,
      prazos_criticos: prazosCriticos || 0,
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
  await app.register(scheduleRoutes)

  // Start notification cron job
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME
  if (!isServerless) {
    startDeadlineNotificationJob()
    app.log.info('✅ Cron job de notificações iniciado')
  } else {
    app.log.info('⏭️ Cron job ignorado (ambiente serverless)')
  }

  // Verify database connection
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1)
    if (error) throw error
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

// Inicia o servidor apenas se executado diretamente
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

    const signals = ['SIGINT', 'SIGTERM'] as const
    signals.forEach((signal) => {
      process.on(signal, async () => {
        app.log.info(`Received ${signal}, shutting down...`)
        await app.close()
        process.exit(0)
      })
    })
  }

  start()
}
