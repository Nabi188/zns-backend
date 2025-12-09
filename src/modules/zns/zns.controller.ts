// src/modules/zns/zns.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import {
  znsListQuerySchema,
  znsDetailParamsSchema,
  znsListResponseSchema,
  znsDetailResponseSchema,
  znsSampleDataResponseSchema,
  znsSyncQuerySchema,
  znsSyncResponseSchema
} from './zns.schema'
import {
  fetchZnsTemplates,
  fetchZnsTemplateInfo,
  fetchZnsTemplateSampleData,
  getActiveOaAccessToken,
  syncZnsTemplates
} from './zns.service'

export async function listTemplates(req: FastifyRequest, reply: FastifyReply) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })
  const query = znsListQuerySchema.parse((req as any).query)
  try {
    const { accessToken } = await getActiveOaAccessToken(
      req.tenantAccess.tenantId,
      query.oaIdZalo
    )
    const result = await fetchZnsTemplates(accessToken, query)
    return reply.code(200).send(znsListResponseSchema.parse(result))
  } catch (e: any) {
    const sc = e?.statusCode
    if (sc === 400)
      return reply.code(400).send({ error: 'multiple_oas_choose_one' })
    if (sc === 404) return reply.code(404).send({ error: 'not_found' })
    if (sc >= 500) return reply.code(502).send({ error: 'zalo_upstream_error' })
    return reply.code(500).send({ error: 'server_error' })
  }
}

export async function getTemplateInfo(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })
  const params = znsDetailParamsSchema.parse((req as any).params)
  const query = znsListQuerySchema.partial().parse((req as any).query)
  try {
    const { accessToken } = await getActiveOaAccessToken(
      req.tenantAccess.tenantId,
      query.oaIdZalo
    )
    const data = await fetchZnsTemplateInfo(accessToken, params.templateId)
    return reply
      .code(200)
      .send(znsDetailResponseSchema.parse({ template: data }))
  } catch (e: any) {
    const sc = e?.statusCode
    if (sc === 400)
      return reply.code(400).send({ error: 'multiple_oas_choose_one' })
    if (sc === 404) return reply.code(404).send({ error: 'not_found' })
    if (sc >= 500) return reply.code(502).send({ error: 'zalo_upstream_error' })
    return reply.code(500).send({ error: 'server_error' })
  }
}

export async function getTemplateSampleData(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })
  const params = znsDetailParamsSchema.parse((req as any).params)
  const query = znsListQuerySchema.partial().parse((req as any).query)
  try {
    const { accessToken } = await getActiveOaAccessToken(
      req.tenantAccess.tenantId,
      query.oaIdZalo
    )
    const data = await fetchZnsTemplateSampleData(
      accessToken,
      params.templateId
    )
    return reply
      .code(200)
      .send(znsSampleDataResponseSchema.parse({ sampleData: data }))
  } catch (e: any) {
    const sc = e?.statusCode
    if (sc === 400)
      return reply.code(400).send({ error: 'multiple_oas_choose_one' })
    if (sc === 404) return reply.code(404).send({ error: 'not_found' })
    if (sc >= 500) return reply.code(502).send({ error: 'zalo_upstream_error' })
    return reply.code(500).send({ error: 'server_error' })
  }
}

export async function syncTemplates(req: FastifyRequest, reply: FastifyReply) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })
  const query = znsSyncQuerySchema.parse((req as any).query)
  try {
    const result = await syncZnsTemplates({
      tenantId: req.tenantAccess.tenantId,
      oaIdZalo: query.oaIdZalo,
      offset: query.offset,
      limit: query.limit,
      status: query.status,
      filterPreset: query.filterPreset
    })
    return reply.code(200).send(znsSyncResponseSchema.parse(result))
  } catch (e: any) {
    const sc = e?.statusCode
    if (sc === 400)
      return reply.code(400).send({ error: 'multiple_oas_choose_one' })
    if (sc === 404) return reply.code(404).send({ error: 'not_found' })
    if (sc >= 500) return reply.code(502).send({ error: 'zalo_upstream_error' })
    return reply.code(500).send({ error: 'server_error' })
  }
}
