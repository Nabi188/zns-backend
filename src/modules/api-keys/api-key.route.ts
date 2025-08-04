import { FastifyInstance } from 'fastify'
import {
  createApiKeyHandler,
  getApiKeysHandler,
  updateApiKeyHandler
} from './api-key.controller'
import {
  createApiKeyRequestSchema,
  createApiKeyResponseSchema,
  getApiKeysResponseSchema,
  getApiKeysQuerySchema,
  updateApiKeyRequestSchema,
  apiKeyBaseSchema,
  updateApiKeyParamsSchema
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
          200: getApiKeysResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    getApiKeysHandler
  )
  router.patch(
    '/:id',
    {
      schema: {
        params: updateApiKeyParamsSchema,
        body: updateApiKeyRequestSchema,
        response: {
          200: apiKeyBaseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    updateApiKeyHandler
  )
}
