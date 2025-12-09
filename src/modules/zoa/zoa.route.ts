// src/modules/zoa/zoa.route.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { oauthExchangeSchema, oauthExchangeResponseSchema } from './zoa.schema'
import { oauthExchange } from './zoa.controller'
import { errorResponseSchema } from '@/schemas/error.schema'

async function zoaRoutes(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>()

  router.post(
    '/oauth/exchange',
    {
      preHandler: [server.authenticate, server.checkMember],
      schema: {
        body: oauthExchangeSchema,
        response: {
          201: oauthExchangeResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          409: errorResponseSchema,
          502: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    oauthExchange
  )
}

export { zoaRoutes }
