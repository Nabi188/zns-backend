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

export async function getTenantsById(tenantId: string, userId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      members: {
        where: { userId },
        select: { role: true }
      },
      createdAt: true,
      updatedAt: true
    }
  })

  if (!tenant) return null

  return {
    id: tenant.id,
    name: tenant.name,
    role: tenant.members[0]?.role ?? null,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt
  }
}
