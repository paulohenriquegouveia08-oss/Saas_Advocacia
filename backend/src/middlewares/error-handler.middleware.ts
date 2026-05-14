import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { ApiError } from '../utils/api-error'

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Sempre logar via console.error para garantir visibilidade na Vercel
  console.error(`[ERROR] ${request.method} ${request.url}:`, error.message, error.stack)

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))

    return reply.status(400).send({
      error: 'Erro de validação',
      statusCode: 400,
      details,
    })
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      statusCode: error.statusCode,
    })
  }

  // Fastify errors (e.g. 404 Not Found)
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    return reply.status(error.statusCode).send({
      error: error.message,
      statusCode: error.statusCode,
    })
  }

  // Unknown errors — ocultar detalhes em produção por segurança
  return reply.status(500).send({
    error: 'Erro interno do servidor',
    statusCode: 500,
  })
}
