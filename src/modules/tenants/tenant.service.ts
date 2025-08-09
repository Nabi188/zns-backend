import { prisma } from '@/lib/prisma'
import { CreateTenantInput } from './tenant.schema'
import { Role } from '@/lib/generated/prisma'

export async function createTenant(input: CreateTenantInput) {
  const { name, ownerId } = input
  // Không cần thêm balance = 0 vì trong database có default rồi
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
