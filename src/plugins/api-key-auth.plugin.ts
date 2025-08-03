import { FastifyInstance } from 'fastify'
import { verifyApiKey } from '@/modules/api-keys/api-key.service'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string
  }
}

export async function apiKeyAuthPlugin(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request, reply) => {
    const auth = request.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      return reply.status(401).send({ message: 'Missing API key' })
    }

    try {
      const apiKey = auth.replace('Bearer ', '')
      const record = await verifyApiKey(apiKey)
      request.tenantId = record.tenantId
    } catch {
      return reply.status(401).send({ message: 'Invalid API key' })
    }
  })
}

// TODO: Đăng ký ở app.ts sau khi hoàn thiện
