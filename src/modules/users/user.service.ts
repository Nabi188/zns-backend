// user.service.ts => Tương tác database

import { prisma } from '@/lib/prisma'

export async function getUsers() {
  return prisma.user.findMany()
}
