// src/modules/zoa/zoa.route.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  oauthExchangeSchema,
  oauthExchangeResponseSchema,
  listZaloOaQuerySchema,
  listZaloOaResponseSchema,
  zaloOaParamsSchema,
  zaloOaDetailsResponseSchema,
  deleteZaloOaResponseSchema
} from './zoa.schema'
import {
  oauthExchange,
  listZaloOaHandler,
  getZaloOaDetailsHandler,
  deleteZaloOaHandler
} from './zoa.controller'
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

  router.get(
    '/',
    {
      preHandler: [server.authenticate, server.checkMember],
      schema: {
        querystring: listZaloOaQuerySchema,
        response: {
          200: listZaloOaResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    listZaloOaHandler
  )

  router.get(
    '/:oaIdZalo',
    {
      preHandler: [server.authenticate, server.checkMember],
      schema: {
        params: zaloOaParamsSchema,
        response: {
          200: zaloOaDetailsResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    getZaloOaDetailsHandler
  )

  router.delete(
    '/:oaIdZalo',
    {
      preHandler: [server.authenticate, server.checkAdmin],
      schema: {
        params: zaloOaParamsSchema,
        response: {
          200: deleteZaloOaResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    deleteZaloOaHandler
  )
}

export { zoaRoutes }
