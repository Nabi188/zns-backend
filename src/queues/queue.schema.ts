//src/queues/queue.schema.ts
import { z } from 'zod'

export const znsSendJobSchema = z.object({
  tenantId: z.string().uuid(),
  oaIdZalo: z.string().optional(),
  templateId: z.string().min(1),
  phone: z.string().min(8),
  templateData: z.object({}).passthrough(),
  trackingId: z.string().min(1)
})

export type ZnsSendJob = z.infer<typeof znsSendJobSchema>
