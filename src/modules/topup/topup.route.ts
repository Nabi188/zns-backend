import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createTopupIntentSchema,
  topupIntentResponseSchema,
  sepayWebhookPayloadSchema,
  topupIntentStatusQuerySchema,
  topupIntentStatusResponseSchema
} from './topup.schema'
import {
  createIntentHandler,
  getTopupIntentStatusHandler,
  sepayWebhookHandler
} from './topup.controller'
import { errorResponseSchema } from '@/schemas/error.schema'

export async function topupRoutes(app: FastifyInstance) {
  const router = app.withTypeProvider<ZodTypeProvider>()

  router.post(
    '/topup/intent',
    {
      preHandler: [app.authenticate, app.checkMember],
      schema: {
        body: createTopupIntentSchema,
        response: {
          201: topupIntentResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    createIntentHandler
  )

  router.post(
    '/topup/sepay/webhook',
    {
      schema: {
        body: sepayWebhookPayloadSchema
      }
    },
    sepayWebhookHandler
  )

  router.get(
    '/topup/intent/status',
    {
      preHandler: [app.authenticate, app.checkMember],
      schema: {
        querystring: topupIntentStatusQuerySchema,
        response: {
          200: topupIntentStatusResponseSchema,
          401: errorResponseSchema
        }
      }
    },
    getTopupIntentStatusHandler
  )
}
