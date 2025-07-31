// user.service.ts => Tương tác database

import { prisma } from '@/lib/prisma'
import { CreateUserInput, LoginInput } from './user.schema'
import { hashPassword } from '@/utils/hash'

export async function createUser(input: CreateUserInput) {
  const { password, ...rest } = input
  const hashedPassword = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      ...rest,
      password: hashedPassword
    }
  })
  return user
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email
    }
  })
}
