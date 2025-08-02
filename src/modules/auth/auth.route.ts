// auth.route.ts

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { loginHandler, meHandler, registerUserHandler } from './auth.controller'
import {
  createUserSchema,
  createUserResponseSchema,
  loginSchema,
  loginResponseSchema
} from './auth.schema'

async function authRoutes(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>()

  router.post(
    '/create',
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

  router.post(
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

  router.get(
    '/me',
    {
      schema: {
        response: {}
      }
    },
    meHandler
  )
}

export { authRoutes }
