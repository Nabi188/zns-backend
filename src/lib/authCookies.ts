// lib/authCookies.ts
import { FastifyReply } from 'fastify'
import { envConfig } from '@/lib/envConfig'

// Dùng cookie names cho thống nhất
export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'

const baseOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  domain:
    envConfig.NODE_ENV === 'production' ? envConfig.FRONTEND_DOMAIN : undefined
} as const

export function setAccessToken(reply: FastifyReply, token: string) {
  reply.setCookie(ACCESS_COOKIE, token, {
    ...baseOptions,
    maxAge: envConfig.ACCESS_TOKEN_MAX_AGE
  })
}

export function clearAccessToken(reply: FastifyReply) {
  reply.clearCookie(ACCESS_COOKIE, { ...baseOptions, maxAge: 0 })
}

export function setRefreshToken(reply: FastifyReply, token: string) {
  // refreshToken chính là sessionId
  reply.setCookie(REFRESH_COOKIE, token, {
    ...baseOptions,
    maxAge: envConfig.SESSION_MAX_AGE
  })
}

export function clearRefreshToken(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, { ...baseOptions, maxAge: 0 })
}

// Bỏ 2 hàm setSessionId và clearSessionId vì không dùng cookie session_id nữa
