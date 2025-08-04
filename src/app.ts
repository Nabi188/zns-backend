// src/app.ts

import redis from '@/lib/redis'
import { apiKeyRoutes } from '@/modules/api-keys'
import { authRoutes } from '@/modules/auth'
import { planRoutes } from '@/modules/plans'
import fastifyCookie from '@fastify/cookie'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { fastify, FastifyReply, FastifyRequest } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import { envConfig } from './lib/envConfig'
import { prisma } from './lib/prisma'

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

server.register(fastifyCookie)
server.register(jwt, {
  secret: envConfig.JWT_SECRET,
  cookie: {
    cookieName: 'token',
    signed: false
  }
})

// Cần thêm CORS để không lỗi trên trình duyệt (APIDog hay postman thì ko lỗi hehe)
server.register(cors, {
  origin: envConfig.FRONTEND_URL,
  credentials: true
})

server.decorate(
  'authenticate',
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT từ cookie thay vì header
      await request.jwtVerify()
    } catch (e) {
      return reply.code(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or missing token'
      })
    }
  }
)

server.register(redis)
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
  await server.register(apiKeyRoutes, { prefix: '/api/api-keys' })
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
