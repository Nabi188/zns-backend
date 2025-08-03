import { FastifyInstance } from 'fastify'
import { createApiKeyHandler, getApiKeysHandler } from './api-key.controller'
import {
  createApiKeyRequestSchema,
  createApiKeyResponseSchema,
  apiKeysSchema,
  getApiKeysQuerySchema
} from './api-key.schema'
import { errorResponseSchema } from '@/schemas/error.schema'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function apiKeyRoutes(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>()

  router.post(
    '/create',
    {
      schema: {
        body: createApiKeyRequestSchema,
        response: {
          201: createApiKeyResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    createApiKeyHandler
  )

  router.get(
    '/',
    {
      schema: {
        querystring: getApiKeysQuerySchema,
        response: {
          200: apiKeysSchema,
          500: errorResponseSchema
        }
      }
    },
    getApiKeysHandler
  )
}
