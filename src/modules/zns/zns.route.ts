// src/modules/zns/zns.route.ts
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  znsListQuerySchema,
  znsListResponseSchema,
  znsDetailParamsSchema,
  znsDetailResponseSchema,
  znsSampleDataResponseSchema,
  znsSyncQuerySchema,
  znsSyncResponseSchema
} from './zns.schema'
import {
  listTemplates,
  getTemplateInfo,
  getTemplateSampleData,
  syncTemplates
} from './zns.controller'
import { errorResponseSchema } from '@/schemas/error.schema'

async function znsRoutes(server: FastifyInstance) {
  const r = server.withTypeProvider<ZodTypeProvider>()

  r.get(
    '/templates',
    {
      preHandler: [server.authenticate, server.checkMember],
      schema: {
        querystring: znsListQuerySchema,
        response: {
          200: znsListResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          502: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    listTemplates
  )

  r.get(
    '/templates/:templateId',
    {
      preHandler: [server.authenticate, server.checkMember],
      schema: {
        params: znsDetailParamsSchema,
        // có thể truyền oaIdZalo ở query để chọn OA
        response: {
          200: znsDetailResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          502: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    getTemplateInfo
  )

  r.get(
    '/templates/:templateId/sample-data',
    {
      preHandler: [server.authenticate, server.checkMember],
      schema: {
        params: znsDetailParamsSchema,
        response: {
          200: znsSampleDataResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          502: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    getTemplateSampleData
  )

  r.post(
    '/templates/sync',
    {
      preHandler: [server.authenticate, server.checkMember],
      schema: {
        querystring: znsSyncQuerySchema,
        response: {
          200: znsSyncResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema,
          502: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    syncTemplates
  )
}

export { znsRoutes }
