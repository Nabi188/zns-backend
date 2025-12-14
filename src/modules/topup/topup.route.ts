import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createTopupIntentSchema,
  topupIntentResponseSchema,
  sepayWebhookPayloadSchema
} from './topup.schema'
import { createIntentHandler, sepayWebhookHandler } from './topup.controller'
import { errorResponseSchema } from '@/schemas/error.schema'

export async function topupRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>()

  r.post(
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

  r.post(
    '/topup/sepay/webhook',
    {
      schema: {
        body: sepayWebhookPayloadSchema,
        response: {
          200: {
            type: 'object',
            properties: { ok: { type: 'boolean' } },
            additionalProperties: true
          }
        }
      }
    },
    sepayWebhookHandler
  )
}
