//src/modules/topup/topup.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import {
  createTopupIntentSchema,
  topupIntentResponseSchema,
  sepayWebhookPayloadSchema,
  topupIntentStatusQuerySchema,
  topupIntentStatusResponseSchema
} from './topup.schema'
import {
  createTopupIntent,
  getTopupIntentStatus,
  handleSePayWebhook
} from './topup.service'
import { envConfig } from '@/lib/envConfig'

export async function createIntentHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.tenantAccess) return reply.code(401).send({ error: 'unauthorized' })

  const body = createTopupIntentSchema.parse((req as any).body)
  const result = await createTopupIntent(req.server, {
    tenantId: req.tenantAccess.tenantId,
    amount: body.amount
  })
  return reply.code(201).send(topupIntentResponseSchema.parse(result))
}

export async function sepayWebhookHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const auth = (req.headers['authorization'] || '') as string
  const token = auth.replace(/^Apikey\s+/i, '')
  if (!auth || token !== envConfig.SEPAY_WEBHOOK_API_KEY) {
    return reply.code(401).send({ error: 'unauthorized' })
  }

  const payload = sepayWebhookPayloadSchema.parse((req as any).body)
  const result = await handleSePayWebhook(req.server, payload)

  return reply.code(200).send({ ok: true, ...result })
}

export async function getTopupIntentStatusHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.tenantAccess) {
    return reply.code(401).send({ error: 'unauthorized' })
  }

  const query = topupIntentStatusQuerySchema.parse(req.query)

  const result = await getTopupIntentStatus(req.server, {
    tenantId: req.tenantAccess.tenantId,
    memo: query.memo
  })

  return reply.send(topupIntentStatusResponseSchema.parse(result))
}
