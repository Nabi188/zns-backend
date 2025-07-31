// user.schema.ts => Định nghĩa schema

import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email format')
})

export const createUserSchema = userSchema.extend({
  password: z.string().min(6, 'Password needs at least 6 characters')
})

export const createUserResponseSchema = userSchema.extend({
  id: z.number()
})

export const loginSchema = z.object({
  email: z.email('invalid email format'),
  password: z.string()
})

export const loginResponseSchema = z.object({
  access_token: z.string()
})

export type LoginInput = z.infer<typeof loginSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>

export type CreateUserInput = z.infer<typeof createUserSchema>
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>
