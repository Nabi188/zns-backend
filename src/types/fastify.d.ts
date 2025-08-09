// types/fastify.d.ts
import 'fastify'
import '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'
import type { Transporter } from 'nodemailer'

declare module 'fastify' {
  interface FastifyInstance {
    nodemailer: Transporter
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string
      email: string
      isVerified: boolean
      tenantId?: string
      role?: string
    }
    user: {
      id: string
      email: string
      isVerified: boolean
      tenantId?: string
      role?: string
    }
  }
}
