// modules/auth/auth.service.ts
import { prisma } from '@/lib/prisma'
import { CreateUserInput } from './auth.schema'
import { hashPassword } from '@/utils/hash'
import { FastifyInstance } from 'fastify'
import { envConfig } from '@/lib/envConfig'
import { randomUUID } from 'crypto'
import { FastifyJWT } from '@fastify/jwt'
import { refreshAccessFromRefreshToken } from '@/lib/authTokens'
import { Role } from '@/lib/generated/prisma'
import { scanKeysRedis } from '@/lib/scanKeysRedis'

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
  return prisma.tenantMember.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
    select: {
      role: true,
      tenant: { select: { id: true, name: true } }
    }
  })
}

export async function getMe(userId: string, tenantId?: string) {
  const user = await prisma.user.findUnique({
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
            select: {
              id: true,
              name: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      }
    }
  })

  if (!user) return null

  let currentTenant = null
  if (tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        balance: true,
        createdAt: true,
        updatedAt: true,
        members: { where: { userId }, select: { role: true } },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { currentPeriodEnd: 'desc' },
          take: 1,
          select: {
            plan: {
              select: {
                name: true,
                monthlyFee: true,
                messageFee: true,
                maxUsers: true
              }
            }
          }
        }
      }
    })

    if (tenant) {
      currentTenant = {
        id: tenant.id,
        name: tenant.name,
        role: tenant.members[0].role,
        balance: tenant.balance,
        plan: tenant.subscriptions[0].plan,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt
      }
    }
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    tenants: user.tenants.map((t) => ({
      id: t.tenant.id,
      name: t.tenant.name,
      role: t.role,
      createdAt: t.tenant.createdAt,
      updatedAt: t.tenant.updatedAt
    })),
    currentTenant
  }
}

export async function findUserById(userId: string) {
  // [EDIT] giữ nguyên select; đã tương thích schema mới
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
  const keys = await scanKeysRedis(server.redis, 'session:*')
  if (keys.length === 0) return 0

  const pipeline = server.redis.pipeline()
  const toDelete: string[] = []

  for (const key of keys) {
    pipeline.get(key)
  }
  const results = await pipeline.exec()

  if (results) {
    for (let i = 0; i < results.length; i++) {
      const [, sessionData] = results[i] || []
      if (typeof sessionData === 'string') {
        try {
          const parsed = JSON.parse(sessionData)
          if (parsed?.userId === userId) {
            toDelete.push(keys[i])
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }

  if (toDelete.length > 0) {
    return await server.redis.del(...toDelete)
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
  role: Role
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
