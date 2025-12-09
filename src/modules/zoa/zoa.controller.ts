// src/modules/zoa/zoa.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { oauthExchangeSchema } from './zoa.schema'
import { exchangeToken } from './zoa.client'
import { upsertZaloOaByToken } from './zoa.service'
import { fetchZnsTemplates } from '@/modules/zns/zns.service'

export async function oauthExchange(req: FastifyRequest, reply: FastifyReply) {
  if (!req.tenantAccess) {
    return reply.code(401).send({ error: 'unauthorized' })
  }

  const { oaIdZalo, code, fetchTemplates, offset, limit, status } =
    oauthExchangeSchema.parse((req as any).body)

  const { tenantId } = req.tenantAccess

  try {
    const tok = await exchangeToken(code)

    const saved = await upsertZaloOaByToken({
      tenantId,
      oaIdZalo,
      accessToken: tok.access_token,
      refreshToken: tok.refresh_token
    })

    let templates: unknown = null
    if (fetchTemplates) {
      try {
        templates = await fetchZnsTemplates(tok.access_token, {
          offset,
          limit,
          status
        })
      } catch {
        templates = { error: 'zalo_templates_error' }
      }
    }

    return reply.code(201).send({
      oa: {
        id: saved.id,
        oaIdZalo: saved.oaIdZalo,
        oaName: saved.oaName,
        isActive: saved.isActive,
        createdAt: saved.createdAt.toISOString()
      },
      templates
    })
  } catch (err: any) {
    const sc = err?.statusCode
    if (sc === 400 || sc === 401)
      return reply.code(400).send({ error: 'invalid_or_expired_code' })
    if (sc === 409)
      return reply
        .code(409)
        .send({ error: 'oa_already_connected_to_other_tenant' })
    if (sc >= 500) return reply.code(502).send({ error: 'zalo_upstream_error' })
    return reply.code(500).send({ error: 'server_error' })
  }
}
