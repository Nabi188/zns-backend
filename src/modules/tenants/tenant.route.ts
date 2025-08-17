import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  createTenantResponseSchema,
  createTenantBodySchema,
  tenantDetailsSchema
} from './tenant.schema'
import { createTenantHandler, getTenantHandler } from './tenant.controller'
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
  router.get(
    '/details',
    {
      preHandler: [server.authenticate]
      // schema: {
      //   response: {
      //     200: tenantDetailsSchema,
      //     400: errorResponseSchema,
      //     500: errorResponseSchema
      //   }
      // }
    },
    getTenantHandler
  )
}

export { tenantRoutes }
