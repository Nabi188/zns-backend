import { prisma } from '@/lib/prisma'
import { CreateTenantInput, UpdateTenantInput } from './tenant.schema'
import { Role } from '@/lib/generated/prisma'

export async function createTenant(input: CreateTenantInput) {
  const { name, ownerId } = input

  const tenant = await prisma.tenant.create({
    data: {
      name,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: Role.admin
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

// export async function getTenantsById(tenantId: string, userId: string) {
//   const tenant = await prisma.tenant.findUnique({
//     where: { id: tenantId },
//     select: {
//       id: true,
//       name: true,
//       owner: {},
//       balance: true,
//       zaloOas: true,
//       znsTemplates: true,
//       members: {
//         where: { userId },
//         select: { role: true }
//       },
//       createdAt: true,
//       updatedAt: true
//     }
//   })

//   if (!tenant) return null

//   return {
//     id: tenant.id,
//     name: tenant.name,
//     role: tenant.members[0]?.role ?? null,
//     createdAt: tenant.createdAt,
//     updatedAt: tenant.updatedAt
//   }
// }

type TenantDetails = {
  id: string
  name: string
  owner: { id: string; fullName: string; email: string }
  role: Role | null
  balance: number
  zaloOas: {
    id: string
    oaIdZalo: string
    oaName: string
    isActive: boolean
    createdAt: string
  }[]
  znsTemplates: any[]
  subscription: {
    id: string
    status: string
    currentPeriodStart: Date
    currentPeriodEnd: Date
    plan: {
      id: number
      name: string
      monthlyFee: number
      messageFee: number
      maxUsers: number
    }
  } | null
  createdAt: Date
  updatedAt: Date
} | null

export async function getTenantDetails(
  userId: string,
  tenantId: string
): Promise<TenantDetails> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      owner: {
        select: { id: true, fullName: true, email: true }
      },
      balance: true,
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
      members: {
        where: { userId },
        select: { role: true }
      },
      subscriptions: {
        where: { status: 'active' },
        orderBy: { currentPeriodEnd: 'desc' },
        take: 1,
        select: {
          id: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          plan: {
            select: {
              id: true,
              name: true,
              monthlyFee: true,
              messageFee: true,
              maxUsers: true
            }
          }
        }
      },
      createdAt: true,
      updatedAt: true
    }
  })

  if (!tenant) return null

  return {
    id: tenant.id,
    name: tenant.name,
    owner: {
      id: tenant.owner.id,
      fullName: tenant.owner.fullName,
      email: tenant.owner.email
    },
    role: tenant.members[0]?.role ?? null,
    balance: tenant.balance,
    zaloOas: tenant.zaloOas.map((oa) => ({
      id: oa.id,
      oaIdZalo: oa.oaIdZalo,
      oaName: oa.oaName,
      isActive: oa.isActive,
      createdAt: oa.createdAt.toISOString()
    })),
    znsTemplates: tenant.znsTemplates,
    subscription: tenant.subscriptions[0] ?? null,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt
  }
}
