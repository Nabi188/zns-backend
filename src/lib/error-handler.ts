// lib/global-error-handler.ts
import { ZodError } from 'zod'
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof SyntaxError) {
    return reply.status(400).send({
      error: 'Invalid JSON format'
    })
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
    })
  }

  // Các lỗi khác
  reply.status(error.statusCode || 500).send({
    error: error.name,
    message: error.message
  })
}
