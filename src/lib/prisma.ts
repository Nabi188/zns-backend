// lib/prisma.ts
import { PrismaClient } from '@/lib/generated/prisma'
// import { PrismaClient } from '@prisma/client'

import 'dotenv/config'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
