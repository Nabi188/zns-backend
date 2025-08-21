// auth.schema.ts => Định nghĩa schema
import { z } from 'zod'
import { currentTenantSchema } from '../tenants/tenant.schema'
import { Role } from '@/lib/generated/prisma'

export const roleEnum = z.enum(Role)

const phoneRegex =
  /^(?:\+84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-5]|9[0-9])[0-9]{7}$/

export const userSchema = z.object({
  fullName: z.string().min(3, 'Full name required at least 3 characters'),
  email: z.email('Invalid email format'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').nullable(),
  avatarUrl: z.string().nullable().optional()
})

export const createUserSchema = userSchema.extend({
  password: z.string().min(6, 'Password needs at least 6 characters')
})

export const createUserResponseSchema = userSchema.extend({
  id: z.string(),
  isVerified: z.boolean(),
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
      role: roleEnum,
      createdAt: z.date(),
      updatedAt: z.date()
    })
  )
})

const meTenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: roleEnum,
  createdAt: z.date(),
  updatedAt: z.date()
})

export const meResponseSchema = createUserResponseSchema.extend({
  currentTenant: currentTenantSchema.nullable().optional(),
  tenants: z.array(meTenantSchema).nullable().optional()
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
      role: roleEnum
    })
  })
})

export const logoutResponseSchema = z.object({
  message: z.literal('Logout successful')
})

export const logoutAllResponseSchema = z.object({
  message: z.literal('Logout all sessions successful')
})

export type LoginInput = z.infer<typeof loginSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>
export type SelectTenantInput = z.infer<typeof selectTenantSchema>
export type SelectTenantResponse = z.infer<typeof selectTenantResponseSchema>
export type MeResponse = z.infer<typeof meResponseSchema>
