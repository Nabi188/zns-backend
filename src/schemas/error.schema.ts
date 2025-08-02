import { z } from 'zod'

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional()
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
