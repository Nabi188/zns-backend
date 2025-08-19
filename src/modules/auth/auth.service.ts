// modules/auth/auth.service.ts
import { prisma } from '@/lib/prisma'
import { CreateUserInput } from './auth.schema'
import { hashPassword } from '@/utils/hash'
import { FastifyInstance } from 'fastify'
import { envConfig } from '@/lib/envConfig'
import { randomUUID } from 'crypto'
import { FastifyJWT } from '@fastify/jwt'
import { refreshAccessFromRefreshToken } from '@/lib/authTokens' // NEW

export async function createUser(input: CreateUserInput) {
  const { password, ...rest } = input
  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      ...rest,
      phone: input.phone || '',
      password: hashedPassword,
      isVerified: false
    }
  })
  return user
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      isVerified: true,
      password: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
      tenants: {
        select: {
          role: true,
          tenant: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }
    }
  })
}

export async function findUserTenant(userId: string, tenantId: string) {
  return prisma.tenantMember.findFirst({
    where: { tenantId, userId },
    select: {
      role: true,
      tenant: { select: { id: true, name: true } }
    }
  })
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      avatarUrl: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
      tenants: {
        select: {
          role: true,
          tenant: {
            select: { id: true, name: true, createdAt: true, updatedAt: true }
          }
        }
      }
    }
  })
}

type JwtPayload = FastifyJWT['payload']

export async function createTokens(
  server: FastifyInstance,
  payload: JwtPayload
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await server.jwt.sign(payload, {
    expiresIn: `${envConfig.ACCESS_TOKEN_MAX_AGE}s`
  })
  // refreshToken chính là sessionId
  const refreshToken = await createSession(server, payload.id)
  return { accessToken, refreshToken }
}

// Tách hàm ra cho clear => session ban đầu chỉ có userId => tenantId/role sẽ được thêm sau select-tenant
export async function createSession(
  server: FastifyInstance,
  userId: string
): Promise<string> {
  const sessionId = randomUUID()
  await server.redis.set(
    `session:${sessionId}`,
    JSON.stringify({ userId }),
    'EX',
    envConfig.SESSION_MAX_AGE
  )
  return sessionId
}

export async function getSession(server: FastifyInstance, sessionId: string) {
  const sessionData = await server.redis.get(`session:${sessionId}`)
  return sessionData ? JSON.parse(sessionData) : null
}

export async function deleteSession(
  server: FastifyInstance,
  sessionId: string
): Promise<boolean> {
  const result = await server.redis.del(`session:${sessionId}`)
  return result > 0
}

export async function deleteAllSessions(
  server: FastifyInstance,
  userId: string
): Promise<number> {
  const keys = await server.redis.keys('session:*')
  if (keys.length === 0) return 0

  const sessions = await server.redis.mget(keys)
  const userSessionKeys: string[] = []

  sessions.forEach((sessionData, index) => {
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData)
        if (parsed.userId === userId) {
          userSessionKeys.push(keys[index])
        }
      } catch (e) {
        console.log(e)
      }
    }
  })

  if (userSessionKeys.length > 0) {
    return await server.redis.del(...userSessionKeys)
  }
  return 0
}

export async function isSessionValid(
  server: FastifyInstance,
  sessionId: string
): Promise<boolean> {
  const exists = await server.redis.exists(`session:${sessionId}`)
  return exists === 1
}

export async function refreshSession(
  server: FastifyInstance,
  sessionId: string
): Promise<boolean> {
  const result = await server.redis.expire(
    `session:${sessionId}`,
    envConfig.SESSION_MAX_AGE
  )
  return result === 1
}

// Thêm tenantId và role vào session (dùng cho select-tenant / switch-tenant)
export async function updateSessionTenant(
  server: FastifyInstance,
  sessionId: string,
  tenantId: string,
  role: string
) {
  const key = `session:${sessionId}`
  const current = await server.redis.get(key)
  if (!current) return false

  const ttl = await server.redis.ttl(key)
  const merged = { ...(JSON.parse(current) || {}), tenantId, role }
  await server.redis.set(
    key,
    JSON.stringify(merged),
    'EX',
    ttl > 0 ? ttl : envConfig.SESSION_MAX_AGE
  )
  return true
}

export async function refreshAccessToken(
  server: FastifyInstance,
  sessionId: string,
  _payload?: JwtPayload
): Promise<string | null> {
  const refreshed = await refreshAccessFromRefreshToken(server, sessionId)
  return refreshed?.accessToken ?? null
}

export async function refreshAccessTokenWithClaims(
  server: FastifyInstance,
  sessionId: string
): Promise<{ accessToken: string; claims: JwtPayload } | null> {
  return refreshAccessFromRefreshToken(server, sessionId)
}
