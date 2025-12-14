// src/modules/public-zns/public-zns.route.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  publicSendBodySchema,
  publicSendResponseSchema
} from './public-zns.schema'
import { publicSendHandler } from './public-zns.controller'
import { errorResponseSchema } from '@/schemas/error.schema'

async function publicZnsRoutes(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>()

  router.post(
    '/send',
    {
      schema: {
        body: publicSendBodySchema,
        response: {
          200: publicSendResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          502: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    publicSendHandler
  )
}

export { publicZnsRoutes }
