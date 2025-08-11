import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createTenantResponseSchema,
  createTenantBodySchema
} from './tenant.schema'
import { createTenantHandler } from './tenant.controller'
import { errorResponseSchema } from '@/schemas/error.schema'

async function tenantRoutes(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>()

  router.post(
    '/create',
    {
      preHandler: [server.authenticate],
      schema: {
        body: createTenantBodySchema,
        response: {
          201: createTenantResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    createTenantHandler
  )
}

export { tenantRoutes }
