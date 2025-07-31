import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { loginHandler, registerUserHandler } from './user.controller'
import {
  createUserSchema,
  createUserResponseSchema,
  loginSchema,
  loginResponseSchema
} from './user.schema'

async function userRoutes(server: FastifyInstance) {
  server.withTypeProvider<ZodTypeProvider>().post(
    '/',
    {
      schema: {
        body: createUserSchema,
        response: {
          201: createUserResponseSchema
        }
      }
    },
    registerUserHandler
  )

  server.withTypeProvider<ZodTypeProvider>().post(
    '/login',
    {
      schema: {
        body: loginSchema,
        response: {
          201: loginResponseSchema
        }
      }
    },
    loginHandler
  )
}

export default userRoutes
