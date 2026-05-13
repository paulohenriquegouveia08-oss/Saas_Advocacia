import type { IncomingMessage, ServerResponse } from 'http'

// Cache do app Fastify — reutilizado entre requests na Vercel
let appPromise: ReturnType<typeof import('../src/server').createApp> | null = null

function getApp() {
  if (!appPromise) {
    // Importar dinamicamente para capturar erros de inicialização
    appPromise = import('../src/server')
      .then(({ createApp }) => createApp())
      .then(async (app) => {
        await app.ready()
        console.log('[Vercel] ✅ Fastify app pronto')
        return app
      })
      .catch((err) => {
        console.error('[Vercel] ❌ Erro ao inicializar app:', err)
        appPromise = null // Reset para tentar novamente no próximo request
        throw err
      })
  }
  return appPromise
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = await getApp()
    app.server.emit('request', req, res)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[Vercel] ❌ Handler error:', message)

    // Responder com erro legível ao invés de crash silencioso
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      error: 'Erro interno do servidor',
      detail: process.env.NODE_ENV !== 'production' ? message : undefined,
      statusCode: 500,
    }))
  }
}
