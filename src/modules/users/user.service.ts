// user.service.ts => Tương tác database

import { prisma } from '@/lib/prisma'

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  })
  return user?.id || null
}
