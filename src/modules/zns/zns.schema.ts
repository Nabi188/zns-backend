import { z } from 'zod'

export const znsTemplateSchema = z.object({
  tenantId: z.string()
})

export const createZnsSchema = z.object({
  tenantId: z.string(),
  templateName: z.string(),
  listParams: z.json()
})

export const createZnsResponseSchema = z.object({
  id: z.string()
})

export type CreateZnsInput = z.infer<typeof createZnsSchema>
