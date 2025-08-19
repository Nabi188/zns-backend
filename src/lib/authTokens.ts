// lib/authTokens.ts

import { FastifyInstance } from 'fastify'
import { envConfig } from '@/lib/envConfig'
import type { FastifyJWT } from '@fastify/jwt'
import { findUserById, getSession, refreshSession } from '@/modules/auth'

export type Claims = FastifyJWT['payload']

export async function signAccessFromClaims(
  server: FastifyInstance,
  claims: Claims
) {
  return server.jwt.sign(claims, {
    expiresIn: `${envConfig.ACCESS_TOKEN_MAX_AGE}s`
  })
}

export async function signAccessFromUserAndSession(
  server: FastifyInstance,
  user: { id: string; email: string; isVerified: boolean },
  session: { tenantId?: string; role?: string } = {},
  override: Partial<Claims> = {}
) {
  const claims: Claims = {
    id: user.id,
    email: user.email,
    isVerified: user.isVerified,
    ...(session.tenantId ? { tenantId: session.tenantId } : {}),
    ...(session.role ? { role: session.role } : {}),
    ...(override ?? {})
  }
  const accessToken = await signAccessFromClaims(server, claims)
  return { accessToken, claims }
}

export async function refreshAccessFromRefreshToken(
  server: FastifyInstance,
  refreshToken: string
): Promise<{ accessToken: string; claims: Claims } | null> {
  const session = await getSession(server, refreshToken)
  if (!session?.userId) return null

  const user = await findUserById(session.userId)
  if (!user) return null

  // Gia hạn session
  await refreshSession(server, refreshToken)

  return signAccessFromUserAndSession(
    server,
    { id: user.id, email: user.email, isVerified: user.isVerified },
    { tenantId: session.tenantId, role: session.role }
  )
}
