// lib/authCookies.ts
import { FastifyReply } from 'fastify'
import { envConfig } from '@/lib/envConfig'

const baseOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  domain:
    envConfig.NODE_ENV === 'production' ? envConfig.FRONTEND_DOMAIN : undefined
} as const

export function setAccessToken(reply: FastifyReply, token: string) {
  reply.setCookie('access_token', token, {
    ...baseOptions,
    maxAge: envConfig.ACCESS_TOKEN_MAX_AGE
  })
}

export function clearAccessToken(reply: FastifyReply) {
  reply.clearCookie('access_token', { ...baseOptions, maxAge: 0 })
}

export function setRefreshToken(reply: FastifyReply, token: string) {
  reply.setCookie('refresh_token', token, {
    ...baseOptions,
    maxAge: envConfig.REFRESH_TOKEN_MAX_AGE
  })
}

export function clearRefreshToken(reply: FastifyReply) {
  reply.clearCookie('refresh_token', { ...baseOptions, maxAge: 0 })
}

export function setSessionId(reply: FastifyReply, sessionId: string) {
  reply.setCookie('session_id', sessionId, {
    ...baseOptions,
    maxAge: envConfig.SESSION_MAX_AGE
  })
}

export function clearSessionId(reply: FastifyReply) {
  reply.clearCookie('session_id', { ...baseOptions, maxAge: 0 })
}
