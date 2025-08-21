import 'fastify'
import '@fastify/jwt'
import { FastifyRequest, FastifyReply } from 'fastify'
import type { Transporter } from 'nodemailer'
import { Role } from '@/lib/generated/prisma'

interface TenantAccess {
  role: Role
  tenantId: string
  name: string
}

declare module 'fastify' {
  interface FastifyInstance {
    nodemailer: Transporter
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
    checkVerified: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
    // Thêm middlewares
    checkOwner: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    checkAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    checkStaff: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    checkMember: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    tenantAccess?: TenantAccess
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
