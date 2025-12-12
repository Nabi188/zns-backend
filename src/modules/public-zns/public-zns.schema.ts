// src/modules/public-zns/public-zns.schema.ts
import { z } from 'zod'

export const publicSendBodySchema = z.object({
  templateId: z.string().min(1),
  phone: z.string().min(8),
  templateData: z.looseObject({}),
  trackingId: z.string().min(1),
  oaIdZalo: z.string().optional()
})

export const publicSendResponseSchema = z.object({
  status: z.literal('QUEUED'),
  trackingId: z.string()
})

export type PublicSendBody = z.infer<typeof publicSendBodySchema>
