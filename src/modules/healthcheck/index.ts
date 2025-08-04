import fastify, { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'

export async function healthcheckRoutes(server: FastifyInstance) {
  server.get('/', async (request, reply) => {
    await request.server.redis.set('healthcheck', 'OK', 'EX', 60)
    const plan = await prisma.plan.findFirst({ select: { id: true } })
    const prisma_status = plan ? 'OK' : 'ERROR'
    const redis_value = await request.server.redis.get('healthcheck')

    return reply.code(200).send({
      redis: redis_value,
      db: prisma_status
    })
  })
}
