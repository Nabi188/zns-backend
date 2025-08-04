// auth.service.ts => Tương tác với database

import { prisma } from '@/lib/prisma'
import { CreateUserInput } from './auth.schema'
import { hashPassword } from '@/utils/hash'

export async function createUser(input: CreateUserInput) {
  const { password, ...rest } = input
  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      ...rest,
      phone: input.phone || '',
      password: hashedPassword
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
      fullName: true,
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
