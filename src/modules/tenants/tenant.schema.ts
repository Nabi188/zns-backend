// tenant.schema.ts

import { z } from 'zod'

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
  name: z.string(),
  ownerId: z.string()
})

export const createTenantResponseSchema = tenantSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const tenantDetailsSchema = tenantSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const tenantsSchema = z.array(tenantDetailsSchema)

export const currentTenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CurrentTenant = z.infer<typeof currentTenantSchema>

export type Tenant = z.infer<typeof tenantSchema>
export type CreateTenantInput = z.infer<typeof createTenantSchema>
export type CreateTenantResponse = z.infer<typeof createTenantResponseSchema>
