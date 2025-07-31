import { prisma } from '@/lib/prisma'
import { CreateUserInput, LoginInput } from './user.schema'
import { hashPassword } from '@/utils/hash'

export async function createUser(input: CreateUserInput) {
  const { password, ...rest } = input
  const { hash, salt } = hashPassword(password)
  const user = await prisma.user.create({
    data: { ...rest, salt, password: hash }
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
