// auth.service.ts => Tương tác với database

import { prisma } from '@/lib/prisma'
import { CreateUserInput } from './auth.schema'
import { hashPassword } from '@/utils/hash'
import { FastifyInstance } from 'fastify'
import { envConfig } from '@/lib/envConfig'
import { randomUUID } from 'crypto'
import { FastifyJWT } from '@fastify/jwt'

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
    where: {
      email
    },
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
              // balance: true, //Bỏ đi không cần trả về balance ở đây mà tách sang service của tài chính đúng hơn
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
    where: {
      tenantId,
      userId
    },
    select: {
      role: true,
      tenant: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId
    },
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
}

type JwtPayload = FastifyJWT['payload']

export async function createTokens(
  server: FastifyInstance,
  payload: JwtPayload
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await server.jwt.sign(payload, {
    expiresIn: `${envConfig.ACCESS_TOKEN_MAX_AGE}s`
  })
  const refreshToken = await server.jwt.sign(payload, {
    expiresIn: `${envConfig.REFRESH_TOKEN_MAX_AGE}s`
  })

  return { accessToken, refreshToken }
}

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
