// src/app.ts

import { globalErrorHandler } from '@/lib/error-handler'
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
import { healthcheckRoutes } from './modules/healthcheck'
import nodemailerPlugin from './plugins/nodemailer'
import { tenantRoutes } from './modules/tenants/tenant.route'
import {
  authenticate,
  checkOwner,
  checkAdmin,
  checkStaff,
  checkMember
} from './middlewares'
import { checkVerified } from './middlewares/authenticate'

export const server = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  },
  ajv: {
    customOptions: {
      allErrors: true,
      verbose: true
    }
  }
}).withTypeProvider<ZodTypeProvider>()

server.register(nodemailerPlugin)

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.setErrorHandler(globalErrorHandler)

server.register(fastifyCookie)
server.register(jwt, {
  secret: envConfig.JWT_SECRET,
  cookie: {
    cookieName: 'access_token',
    signed: false
  }
})

// Cần thêm CORS để không lỗi trên trình duyệt (APIDog hay postman thì ko lỗi hehe)
server.register(cors, {
  origin: envConfig.FRONTEND_URL,
  credentials: true
})

// Đổi qua dùng access_token
server.decorate('authenticate', authenticate)
server.decorate('checkVerified', checkVerified)
//Thêm middleware
server.decorate('checkOwner', checkOwner)
server.decorate('checkAdmin', checkAdmin)
server.decorate('checkStaff', checkStaff)
server.decorate('checkMember', checkMember)

server.register(redis)

// Register routes
async function registerRoutes() {
  // await server.register(userRoutes, { prefix: '/api/users' })
  await server.register(planRoutes, { prefix: '/api/plans' })
  await server.register(authRoutes, { prefix: '/api/auth' })
  await server.register(apiKeyRoutes, { prefix: '/api/api-keys' })
  await server.register(tenantRoutes, { prefix: '/api/tenants' })
  await server.register(healthcheckRoutes, { prefix: '/api/healthcheck' })
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
      `Health check available at http://${envConfig.BASE_URL}:${envConfig.PORT}/api/healthcheck`
    )
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

main()
