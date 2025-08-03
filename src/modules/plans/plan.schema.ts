// plan.schema.ts => Định nghĩa schema plan

import { z } from 'zod'

export const planSchema = z.object({
  name: z.string().min(3, 'Plan name is required'),
  monthlyFee: z.number().min(0, 'Monthly fee must be a positive number'),
  messageFee: z.number().min(0, 'Message fee must be a positive number'),
  maxUsers: z.number().min(1, 'Maximum users must be at least 1'),
  isActive: z.boolean()
})

export const createPlanResponseSchema = planSchema.extend({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const plansSchema = z.array(createPlanResponseSchema)

export type CreatePlanResponse = z.infer<typeof createPlanResponseSchema>
export type CreatePlanInput = z.infer<typeof planSchema>
export type Plan = z.infer<typeof planSchema>
export type Plans = z.infer<typeof plansSchema>
