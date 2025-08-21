import { prisma } from '@/lib/prisma'
import {
  CreateTenantInput,
  TenantDetails,
  UpdateTenantInput
} from './tenant.schema'
import { Role } from '@/lib/generated/prisma'
import { FastifyInstance } from 'fastify'
import { randomInt } from 'crypto'
import { scanKeysRedis } from '@/lib/scanKeysRedis'

export async function createTenant(input: CreateTenantInput) {
  const { name, ownerId } = input

  const tenant = await prisma.tenant.create({
    data: {
      name,
      members: {
        create: {
          userId: ownerId,
          role: Role.OWNER
        }
      }
    },
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  })

  return {
    ...tenant,
    members: tenant.members.map((m) => ({
      userId: m.userId,
      fullName: m.user.fullName,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt
    }))
  }
}

export async function updateTenant(input: UpdateTenantInput) {
  const { id, name } = input

  const tenant = prisma.tenant.update({
    where: { id },
    data: { name }
  })

  return tenant
}

export async function getTenantsByMember(userId: string) {
  const tenants = await prisma.tenant.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      members: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return tenants
}

export async function getTenantDetails(
  tenantId: string
): Promise<TenantDetails | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      balance: true,
      createdAt: true,
      updatedAt: true,
      members: {
        select: {
          role: true,
          user: { select: { fullName: true, email: true } }
        }
      },
      zaloOas: {
        select: {
          id: true,
          oaIdZalo: true,
          oaName: true,
          isActive: true,
          createdAt: true
        }
      },
      znsTemplates: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { currentPeriodEnd: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
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

  if (!tenant) return null

  const owner = tenant.members.find((m) => m.role === Role.OWNER)

  return {
    id: tenant.id,
    name: tenant.name,
    owner: {
      fullName: owner?.user.fullName ?? '',
      email: owner?.user.email ?? ''
    },
    balance: tenant.balance,
    zaloOas: tenant.zaloOas.map((oa) => ({
      id: oa.id,
      oaIdZalo: oa.oaIdZalo,
      oaName: oa.oaName,
      isActive: oa.isActive,
      createdAt: oa.createdAt
    })),
    znsTemplates: tenant.znsTemplates,
    subscription: tenant.subscriptions[0] ?? null,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt
  }
}

export async function createInviteCode(
  server: FastifyInstance,
  tenantId: string,
  email: string,
  role: Role
) {
  const expiresIn = 24 * 60 * 60
  const inviteCode = randomInt(100000, 1000000).toString()
  const key = `invite:${tenantId}:${email}`

  await server.redis.setex(
    key,
    expiresIn,
    JSON.stringify({ tenantId, email, role, inviteCode, expiresIn })
  )

  return { inviteCode, key, expiresIn }
}

export async function getInviteList(server: FastifyInstance, tenantId: string) {
  const keys = await scanKeysRedis(server.redis, `invite:${tenantId}:*`) // [EDIT]
  if (!keys.length) return []

  const items = await Promise.all(
    keys.map(async (key) => {
      const raw = await server.redis.get(key)
      if (!raw) return null
      const ttl = await server.redis.ttl(key)
      if (ttl <= 0) return null
      const {
        tenantId: t,
        email,
        role,
        inviteCode,
        expiresIn
      } = JSON.parse(raw)
      return {
        key,
        tenantId: t,
        email,
        role: role as Role,
        inviteCode,
        expiresIn,
        ttl
      }
    })
  )

  return items.filter(Boolean) as Array<{
    key: string
    tenantId: string
    email: string
    role: Role
    inviteCode: string
    expiresIn: number
    ttl: number
  }>
}

export async function verifyInviteCode(
  server: FastifyInstance,
  tenantId: string,
  email: string,
  inviteCode: string
) {
  const key = `invite:${tenantId}:${email}`
  const raw = await server.redis.get(key)
  if (!raw) return null

  let parsed: any
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (parsed.inviteCode !== inviteCode) return null
  const ttl = await server.redis.ttl(key)
  if (ttl <= 0) return null

  await server.redis.del(key)

  return {
    key,
    tenantId: parsed.tenantId,
    email: parsed.email,
    role: parsed.role as Role,
    inviteCode: parsed.inviteCode,
    expiresIn: parsed.expiresIn,
    ttl
  }
}

export async function revokeInvite(
  server: FastifyInstance,
  tenantId: string,
  email: string
) {
  const key = `invite:${tenantId}:${email}`
  const n = await server.redis.del(key)
  return n > 0
}

export async function revokeAllInvites(
  server: FastifyInstance,
  tenantId: string
) {
  const keys = await scanKeysRedis(server.redis, `invite:${tenantId}:*`)
  if (!keys.length) return 0
  return server.redis.del(...keys)
}
