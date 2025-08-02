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
              balance: true,
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
