// auth.route.ts

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  loginHandler,
  logoutAllHandler,
  logoutHandler,
  meHandler,
  registerUserHandler,
  selectTenantHandler,
  sendOTPHandler,
  verifyOTPHandler
} from './auth.controller'
import {
  createUserSchema,
  createUserResponseSchema,
  loginSchema,
  loginResponseSchema,
  selectTenantSchema,
  selectTenantResponseSchema,
  meResponseSchema,
  logoutResponseSchema
} from './auth.schema'
import { errorResponseSchema } from '@/schemas/error.schema'
import {
  sendOtpResponseSchema,
  verifyOtpResponseSchema,
  verifyOtpSchema
} from './verification.schema'

async function authRoutes(server: FastifyInstance) {
  const router = server.withTypeProvider<ZodTypeProvider>()

  router.post(
    '/create',
    {
      schema: {
        body: createUserSchema,
        response: {
          201: createUserResponseSchema,
          409: errorResponseSchema,
          500: errorResponseSchema
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
          200: loginResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    loginHandler
  )

  router.get(
    '/me',
    {
      preHandler: [server.authenticate],
      schema: {
        response: {
          200: meResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema
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
          200: selectTenantResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    selectTenantHandler
  )

  server.get(
    '/logout',
    {
      schema: {
        response: {
          200: logoutResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    logoutHandler
  )

  server.get(
    '/logout/all',
    {
      schema: {
        response: {
          200: logoutResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    logoutAllHandler
  )

  router.post(
    '/otp/send',
    {
      preHandler: [server.authenticate],
      schema: {
        response: {
          200: sendOtpResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    sendOTPHandler
  )

  router.post(
    '/otp/verify',
    {
      preHandler: [server.authenticate],
      schema: {
        body: verifyOtpSchema,
        response: {
          200: verifyOtpResponseSchema,
          400: errorResponseSchema,
          401: errorResponseSchema,
          500: errorResponseSchema
        }
      }
    },
    verifyOTPHandler
  )
}

export { authRoutes }
