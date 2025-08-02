// user.schema.ts => Định nghĩa schema

import { z } from 'zod'

export const userSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email format'),
  phone: z.string().optional()
})
