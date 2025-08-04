// cookie.ts

import { FastifyReply } from 'fastify'
import { envConfig } from '@/lib/envConfig'

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  domain:
    envConfig.NODE_ENV === 'production' ? envConfig.FRONTEND_DOMAIN : undefined,
  maxAge: envConfig.JWT_MAX_AGE
} as const

export function setAuthCookie(reply: FastifyReply, token: string) {
  reply.setCookie('token', token, cookieOptions)
}

export function clearAuthCookie(reply: FastifyReply) {
  reply.clearCookie('token', {
    ...cookieOptions,
    // Thêm maxAge cho chắc
    maxAge: 0
  })
}
