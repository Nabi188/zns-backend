// auth.schema.ts => Đinh nghĩa scheama
import { z } from 'zod'
import { userSchema } from '../users'
import { tenantDetailsSchema } from '../tenants/tenant.schema'

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
  password: z.string()
})

export const loginResponseSchema = z.object({
  access_token: z.string()
})

export const meResponseSchema = createUserResponseSchema.extend({
  tenants: z.array(tenantDetailsSchema).optional()
})

// Types
export type LoginInput = z.infer<typeof loginSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>
