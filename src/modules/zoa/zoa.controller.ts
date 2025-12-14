// src/modules/zoa/zoa.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import {
  oauthExchangeSchema,
  listZaloOaQuerySchema,
  zaloOaParamsSchema,
  deleteZaloOaResponseSchema
} from './zoa.schema'
import { exchangeToken, getOaInfo } from './zoa.client'
import {
  upsertZaloOaByToken,
  listZaloOa,
  getZaloOaByOaIdZalo,
  deleteZaloOaByOaIdZalo
} from './zoa.service'
import { fetchZnsTemplates } from '@/modules/zns/zns.service'

export async function oauthExchange(req: FastifyRequest, reply: FastifyReply) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })
  const { tenantId } = req.tenantAccess

  try {
    // BỎ status/filterPreset: chỉ còn offset, limit
    const { oaIdZalo, code, fetchTemplates, offset, limit } =
      oauthExchangeSchema.parse((req as any).body)

    req.log.info({ oaIdZalo }, 'oauth_exchange_start')

    const tok = await exchangeToken(code)
    const info = await getOaInfo(tok.access_token)

    req.log.info(
      { hasAccess: !!tok?.access_token },
      'oauth_exchange_got_tokens'
    )

    const saved = await upsertZaloOaByToken({
      tenantId,
      oaIdZalo,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token,
      oaName: info?.name || oaIdZalo,
      oaMeta: info
    })

    req.log.info({ oaId: saved.id }, 'oauth_exchange_saved_oa')

    let templates: unknown = null
    if (fetchTemplates) {
      try {
        // gọi list templates chỉ với offset/limit theo luồng mới
        templates = await fetchZnsTemplates(tok.access_token, {
          offset,
          limit
        })
      } catch (e) {
        req.log.warn({ err: e }, 'fetch_zns_templates_failed')
        templates = { error: 'zalo_templates_error' }
      }
    }

    return reply.code(201).send({
      oa: {
        id: saved.id,
        oaIdZalo: saved.oaIdZalo,
        oaName: saved.oaName,
        isActive: saved.isActive,
        createdAt: saved.createdAt.toISOString(),
        oaMeta: (saved as any).oaMeta ?? null
      },
      templates
    })
  } catch (err: any) {
    if (err instanceof ZodError) {
      req.log.warn({ issues: err.issues }, 'oauth_exchange_body_invalid')
      return reply.code(400).send({ error: 'invalid_body', issues: err.issues })
    }
    const sc = Number(err?.statusCode) || 500
    const detail = err?.payload ?? { message: err?.message }
    if (sc >= 400 && sc < 500)
      return reply.code(400).send({ error: 'invalid_or_expired_code', detail })
    if (sc >= 500)
      return reply.code(502).send({ error: 'zalo_upstream_error', detail })
    req.log.error({ err }, 'oauth_exchange_unhandled')
    return reply.code(500).send({ error: 'server_error', detail })
  }
}

export async function listZaloOaHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })
  const q = listZaloOaQuerySchema.parse((req as any).query)
  const { tenantId } = req.tenantAccess

  const { items, total, page, pageSize } = await listZaloOa({
    tenantId,
    isActive: q.isActive,
    q: q.q,
    page: q.page,
    pageSize: q.pageSize
  })

  return reply.send({ items, meta: { page, pageSize, total } })
}

export async function getZaloOaDetailsHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })
  const { oaIdZalo } = zaloOaParamsSchema.parse((req as any).params)
  const { tenantId } = req.tenantAccess

  const oa = await getZaloOaByOaIdZalo(tenantId, oaIdZalo)
  if (!oa) return reply.code(404).send({ error: 'not_found' })

  return reply.send({
    id: oa.id,
    oaIdZalo: oa.oaIdZalo,
    oaName: oa.oaName,
    isActive: oa.isActive,
    createdAt: oa.createdAt.toISOString(),
    oaMeta: (oa as any).oaMeta ?? null
  })
}

export async function deleteZaloOaHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })
  const { tenantId } = req.tenantAccess
  const { oaIdZalo } = zaloOaParamsSchema.parse((req as any).params)

  try {
    const result = await deleteZaloOaByOaIdZalo(tenantId, oaIdZalo)
    return reply.send(deleteZaloOaResponseSchema.parse(result))
  } catch (err: any) {
    const sc = err?.statusCode
    if (sc === 404) return reply.code(404).send({ error: 'not_found' })
    if (sc === 409) return reply.code(409).send({ error: 'oa_has_messages' })
    return reply.code(500).send({ error: 'server_error' })
  }
}
