// middleware/authenticate.ts

import { FastifyReply, FastifyRequest } from 'fastify'
import {
  setAccessToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE
} from '@/lib/authCookies'
import { refreshAccessFromRefreshToken } from '@/lib/authTokens'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const accessToken =
      (request.cookies as any)[ACCESS_COOKIE] ?? request.cookies.access_token
    const refreshToken =
      (request.cookies as any)[REFRESH_COOKIE] ?? request.cookies.refresh_token

    const refreshAccessToken = async () => {
      if (!refreshToken) {
        return reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'Missing refresh token' })
      }

      const refreshed = await refreshAccessFromRefreshToken(
        request.server,
        refreshToken
      )

      if (!refreshed) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token'
        })
      }

      setAccessToken(reply, refreshed.accessToken)
      request.user = refreshed.claims as any
      return
    }

    if (!accessToken) {
      return await refreshAccessToken()
    }

    try {
      // access_token hợp lệ
      request.user = await request.server.jwt.verify(accessToken)
      return
    } catch {
      return await refreshAccessToken()
    }
  } catch {
    return reply
      .code(401)
      .send({ error: 'Unauthorized', message: 'Authentication failed' })
  }
}
