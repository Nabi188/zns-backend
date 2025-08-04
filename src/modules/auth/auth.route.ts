// auth.route.ts

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  loginHandler,
  meHandler,
  registerUserHandler,
  selectTenantHandler
} from './auth.controller'
import {
  createUserSchema,
  createUserResponseSchema,
  loginSchema,
  loginResponseSchema,
  selectTenantSchema,
  selectTenantResponseSchema,
  meResponseSchema
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
          200: loginResponseSchema
        }
      }
    },
    loginHandler
  )

  //TODO: Chưa làm me handler
  router.get(
    '/me',
    {
      preHandler: [server.authenticate],
      schema: {
        response: {
          200: meResponseSchema
        }
      }
    },
    meHandler
  )

  router.post(
    '/select-tenant',
    {
      preHandler: [server.authenticate],
      schema: {
        body: selectTenantSchema,
        response: {
          200: selectTenantResponseSchema
        }
      }
    },
    selectTenantHandler
  )
}

export { authRoutes }
