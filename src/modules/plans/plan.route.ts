// plan.route.ts => Định nghĩa các route cho plan

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { createPlanHander, getPlansHandler } from './plan.controller'
import {
  planSchema,
  createPlanResponseSchema,
  plansSchema
} from './plan.schema'
import { errorResponseSchema } from '@/schemas/error.schema'

async function planRoutes(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>()

  // Create plan route
  router.post(
    '/create',
    {
      schema: {
        body: planSchema,
        response: {
          201: createPlanResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    createPlanHander
  )

  // Get all plans route
  router.get(
    '/',
    {
      schema: {
        response: {
          200: plansSchema,
          500: errorResponseSchema
        }
      }
    },
    getPlansHandler
  )
}

export { planRoutes }
