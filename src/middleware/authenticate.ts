// lib/middleware/authenticate.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { envConfig } from '@/lib/envConfig'
import { setAccessToken } from '@/lib/authCookies'
import { findUserById } from '@/modules/auth'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const accessToken = request.cookies.access_token
    if (!accessToken) {
      return reply
        .code(401)
        .send({ error: 'Unauthorized', message: 'Missing access token' })
    }

    try {
      request.user = await request.server.jwt.verify(accessToken)
    } catch {
      const refreshToken = request.cookies.refresh_token
      if (!refreshToken) {
        return reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'Missing refresh token' })
      }

      const session = await request.server.redis.get(`session:${refreshToken}`)
      if (!session) {
        return reply
          .code(401)
          .send({
            error: 'Unauthorized',
            message: 'Invalid or expired refresh token'
          })
      }

      const { userId } = JSON.parse(session)
      const user = await findUserById(userId)
      if (!user) {
        return reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'User not found' })
      }

      const payload = {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified
      }

      const newAccessToken = await request.server.jwt.sign(payload, {
        expiresIn: `${envConfig.ACCESS_TOKEN_MAX_AGE}s`
      })

      setAccessToken(reply, newAccessToken)
      request.user = payload
    }
  } catch {
    return reply
      .code(401)
      .send({ error: 'Unauthorized', message: 'Authentication failed' })
  }
}
