// tenant.schema.ts

import { Role } from '@/lib/generated/prisma'
import { z } from 'zod'

export const roleEnum = z.enum(Role)

export const tenantMemberSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  email: z.string(),
  role: z.string(),
  joinedAt: z.date()
})

export const tenantSchema = z.object({
  name: z.string(),
  balance: z.number(),
  members: z.array(tenantMemberSchema)
})

export const createTenantSchema = z.object({
  ownerId: z.string(),
  name: z.string()
})
export const createTenantBodySchema = z.object({
  name: z.string()
})

export const updateTenantSchema = z.object({
  id: z.string(),
  name: z.string()
})

export const createTenantResponseSchema = tenantSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const tenantOwnerSchema = z.object({
  fullName: z.string(),
  email: z.string()
})

export const zaloOASchema = z.object({
  id: z.string(),
  oaIdZalo: z.string(),
  oaName: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date()
})

export const tenantZnsTemplateSchema = z.object({
  templateId: z.string(),
  templateName: z.string(),
  isActive: z.boolean()
})

export const planSchema = z.object({
  name: z.string(),
  monthlyFee: z.number(),
  messageFee: z.number(),
  maxUsers: z.number()
})

export const subscriptionSchema = z.object({
  id: z.string(),
  status: z.string(),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  plan: planSchema
})

// omit members vì API này không cần trả về thông tin thành viên
export const tenantDetailsSchema = tenantSchema.omit({ members: true }).extend({
  id: z.string(),
  owner: tenantOwnerSchema,
  zaloOas: z.array(zaloOASchema),
  znsTemplates: z.array(tenantZnsTemplateSchema),
  subscription: subscriptionSchema,
  createdAt: z.date(),
  updatedAt: z.date()
})

export const tenantsSchema = z.array(tenantDetailsSchema)

export const currentTenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleEnum,
  balance: z.number(),
  plan: z
    .object({
      name: z.string(),
      monthlyFee: z.number(),
      messageFee: z.number(),
      maxUsers: z.number()
    })
    .nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const updateMemberSchema = z.object({
  userId: z.string(),
  role: Role
})

export const memberJoinSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  inviteCode: z.string()
})

export type CurrentTenant = z.infer<typeof currentTenantSchema>
export type Tenant = z.infer<typeof tenantSchema>
export type CreateTenantInput = z.infer<typeof createTenantSchema>
export type CreateTenantResponse = z.infer<typeof createTenantResponseSchema>
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>
export type CreateTenantBody = z.infer<typeof createTenantBodySchema>
export type TenantDetails = z.infer<typeof tenantDetailsSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
export type MemberJoinInput = z.infer<typeof memberJoinSchema>
