import Fastify from 'fastify'
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
import { startDeadlineNotificationJob } from './jobs/deadline-notifications.job'
import { pool } from './config/database'

async function bootstrap() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  })

  // CORS
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  })

  // Global error handler
  app.setErrorHandler(errorHandler)

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
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

  // Start notification cron job
  startDeadlineNotificationJob()

  // Verify database connection
  try {
    await pool.query('SELECT 1')
    app.log.info('✅ Conexão com banco de dados estabelecida')
  } catch (error) {
    app.log.error(error as Error, '❌ Erro ao conectar com banco de dados')
  }

  // Start server
  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info(`🚀 Servidor rodando em http://${env.HOST}:${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM']
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down...`)
      await app.close()
      await pool.end()
      process.exit(0)
    })
  })
}

bootstrap()
