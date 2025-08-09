// src/lib/redis.ts
import fp from 'fastify-plugin'
import Redis from 'ioredis'
import { envConfig } from './envConfig'

export default fp(async (fastify) => {
  const redis = new Redis(envConfig.REDIS_URL!)

  fastify.decorate('redis', redis)

  fastify.addHook('onClose', async () => {
    await redis.quit()
  })
})

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}
