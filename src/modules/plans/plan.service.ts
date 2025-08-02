// plan.service.ts => Twong tác database

import { prisma } from '@/lib/prisma'
import { CreatePlanInput } from './plan.schema'

export async function createPlan(input: CreatePlanInput) {
  const plan = await prisma.plan.create({
    data: input
  })
  return plan
}

export async function getPlans() {
  return prisma.plan.findMany({
    orderBy: {
      monthlyFee: 'asc'
    }
  })
}
