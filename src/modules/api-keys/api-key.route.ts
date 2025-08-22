import { FastifyInstance } from 'fastify'
import {
  createApiKeyHandler,
  deleteApiKeyHandler,
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
  updateApiKeyParamsSchema,
  deleteApiKeyResponseSchema,
  apiKeyWithCreatorSchema
} from './api-key.schema'
import { errorResponseSchema } from '@/schemas/error.schema'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function apiKeyRoutes(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>()

  router.post(
    '/create',
    {
      preHandler: [server.authenticate, server.checkAdmin],
      schema: {
        body: createApiKeyRequestSchema,
        response: {
          200: createApiKeyResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    createApiKeyHandler
  )

  router.get(
    '/',
    {
      preHandler: [server.authenticate, server.checkAdmin],
      schema: {
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
      preHandler: [server.authenticate, server.checkAdmin],
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

  router.post(
    '/delete',
    {
      preHandler: [server.authenticate, server.checkAdmin],
      schema: {
        body: updateApiKeyParamsSchema,
        response: {
          200: deleteApiKeyResponseSchema,
          404: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    deleteApiKeyHandler
  )
}
