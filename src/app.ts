import userRoutes from '@/modules/users/user.route'
import jwt from '@fastify/jwt'
import { fastify, FastifyReply, FastifyRequest } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import { envConfig } from './lib/envConfig'

export const server = fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>()

server.register(jwt, {
  secret: envConfig.JWT_SECRET
})

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

// Setup Zod validation
server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.get('/healthcheck', async function () {
  return { status: 'OK' }
})

async function main() {
  try {
    await server.register(userRoutes, { prefix: '/api/users' })

    await server.listen({
      port: envConfig.PORT,
      host: envConfig.BASE_URL
    })

    console.log(`
      Server is running at http://${envConfig.BASE_URL}:${envConfig.PORT}
    `)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

main()
