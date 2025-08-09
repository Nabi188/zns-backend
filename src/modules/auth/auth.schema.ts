// auth.schema.ts => Định nghĩa schema
import { z } from 'zod'
import { userSchema } from '../users'
import { currentTenantSchema } from '../tenants/tenant.schema'

export const createUserSchema = userSchema.extend({
  password: z.string().min(6, 'Password needs at least 6 characters')
})

export const createUserResponseSchema = userSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const loginSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required!')
})

export const loginResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    fullName: z.string(),
    avatarUrl: z.string().optional(),
    isVerified: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
  }),
  tenants: z.array(
    z.object({
      tenantId: z.string(),
      name: z.string(),
      role: z.string(),
      createdAt: z.date(),
      updatedAt: z.date()
    })
  )
})

const meTenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().optional(),
  role: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const meResponseSchema = createUserResponseSchema.extend({
  currentTenant: currentTenantSchema.nullable(),
  tenants: z.array(meTenantSchema)
})

export const selectTenantSchema = z.object({
  tenantId: z.string()
})

// Schema cho response của selectTenant - trả về dữ liệu cho FE
export const selectTenantResponseSchema = z.object({
  success: z.literal(true),
  user: z.object({
    id: z.string(),
    email: z.string(),
    currentTenant: z.object({
      tenantId: z.string(),
      name: z.string(),
      role: z.string()
    })
  })
})

export const logoutResponseSchema = z.object({
  message: z.literal('Logout successful')
})

export type LoginInput = z.infer<typeof loginSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>
export type SelectTenantInput = z.infer<typeof selectTenantSchema>
export type SelectTenantResponse = z.infer<typeof selectTenantResponseSchema>
export type MeResponse = z.infer<typeof meResponseSchema>
