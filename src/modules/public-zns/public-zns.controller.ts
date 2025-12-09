// src/modules/public-zns/public-zns.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import {
  publicSendBodySchema,
  publicSendResponseSchema
} from './public-zns.schema'
import { publicSend } from './public-zns.service'

export async function publicSendHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const apiKey = (req.headers['x-api-key'] ||
      req.headers['X-API-Key'] ||
      '') as string
    const body = publicSendBodySchema.parse((req as any).body)
    const result = await publicSend({ apiKey, body })
    return reply.code(200).send(publicSendResponseSchema.parse(result))
  } catch (e: any) {
    const sc = e?.statusCode
    if (sc === 401) return reply.code(401).send({ error: 'invalid_api_key' })
    if (sc === 404) return reply.code(404).send({ error: 'template_not_found' })
    if (sc === 400)
      return reply.code(400).send({ error: e.message || 'bad_request' })
    if (sc === 502)
      return reply
        .code(502)
        .send({ error: 'zalo_upstream_error', details: e.payload })
    return reply.code(500).send({ error: 'server_error' })
  }
}
