// src/app.ts

// import { userRoutes } from '@/modules/users'
import { planRoutes } from '@/modules/plans'
import jwt from '@fastify/jwt'
import { fastify, FastifyReply, FastifyRequest } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import { envConfig } from './lib/envConfig'
import redis from '@/lib/redis'
import { prisma } from './lib/prisma'
import { authRoutes } from '@/modules/auth'

export const server = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
}).withTypeProvider<ZodTypeProvider>()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.register(jwt, {
  secret: envConfig.JWT_SECRET
})

server.register(redis)

server.decorate(
  'auth',
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch (e) {
      return reply.send(e)
    }
  }
)

// Check kết nói redis và db
server.get(
  '/healthcheck',
  async function (request: FastifyRequest, reply: FastifyReply) {
    await request.server.redis.set('healthcheck', 'OK', 'EX', 60)

    const user = await prisma.user.findFirst({
      select: { id: true }
    })

    let prisma_status = 'ERROR'
    if (user) {
      prisma_status = 'OK'
    }

    const redis_value = await request.server.redis.get('healthcheck')

    return reply.code(200).send({
      redis: redis_value,
      db: prisma_status
    })
  }
)

// Register routes
async function registerRoutes() {
  // await server.register(userRoutes, { prefix: '/api/users' })
  await server.register(planRoutes, { prefix: '/api/plans' })
  await server.register(authRoutes, { prefix: '/api/auth' })
}

async function main() {
  try {
    await registerRoutes()

    await server.listen({
      port: envConfig.PORT,
      host: envConfig.BASE_URL
    })

    server.log.info(
      `Server is running at http://${envConfig.BASE_URL}:${envConfig.PORT}`
    )
    server.log.info(
      `Health check available at http://${envConfig.BASE_URL}:${envConfig.PORT}/healthcheck`
    )
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

main()
