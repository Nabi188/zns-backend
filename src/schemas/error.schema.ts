// schemas/error.schema.ts
import { z } from 'zod'

export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  // TODO: Triển khai thêm bộ CODE lỗi để dễ debug
  code: z.string().optional(),
  details: z.any().optional()
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>
