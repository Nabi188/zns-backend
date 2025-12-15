import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  messageLogListQuerySchema,
  messageLogListResponseSchema
} from './message-log.schema'
import { listMessageLogsHandler } from './message-log.controller'
import { errorResponseSchema } from '@/schemas/error.schema'

export async function messageLogRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>()

  router.get(
    '/message-logs',
    {
      preHandler: [app.authenticate, app.checkMember],
      schema: {
        querystring: messageLogListQuerySchema,
        response: {
          200: messageLogListResponseSchema,
          401: errorResponseSchema
        }
      }
    },
    listMessageLogsHandler
  )
}
