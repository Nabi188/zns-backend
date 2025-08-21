// middlewares/tenantAccess.ts

import { FastifyRequest } from 'fastify'
import { prisma } from '@/lib/prisma'
import { Role } from '@/lib/generated/prisma'

export interface TenantAccess {
  name: string
  role: Role
  tenantId: string
}

export async function getTenantAccess(
  request: FastifyRequest,
  tenantId: string
): Promise<TenantAccess | null> {
  const userId = request.user?.id

  if (!userId) {
    return null
  }

  try {
    const member = await prisma.tenantMember.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      },
      select: {
        tenant: { select: { id: true, name: true } },
        role: true
      }
    })

    if (!member) {
      return null
    }

    return {
      role: member.role,
      tenantId,
      name: member.tenant.name
    }
  } catch (error) {
    console.error('Error checking tenant access:', error)
    return null
  }
}
