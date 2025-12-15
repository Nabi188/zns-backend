import { FastifyReply, FastifyRequest } from 'fastify'
import {
  messageLogListQuerySchema,
  messageLogListResponseSchema
} from './message-log.schema'
import { listMessageLogs } from './message-log.service'

export async function listMessageLogsHandler(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (!req.tenantAccess) {
    return reply.code(401).send({ error: 'unauthorized' })
  }

  const query = messageLogListQuerySchema.parse(req.query)

  const result = await listMessageLogs({
    tenantId: req.tenantAccess.tenantId,
    query
  })

  return reply.send(messageLogListResponseSchema.parse(result))
}
