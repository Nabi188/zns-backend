import { z } from 'zod'
import { MessageStatus } from '@prisma/client'

export const messageLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED']).optional(),
  phone: z.string().optional(),
  trackingId: z.string().optional(),
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional()
})

export const messageLogItemSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  recipientPhone: z.string(),
  templateId: z.string(),
  templateName: z.string(),
  templateData: z.any(),
  status: z.enum(MessageStatus),
  msgId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  amount: z.number().nullable()
})

export const messageLogListResponseSchema = z.object({
  items: z.array(messageLogItemSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number()
  })
})

export type MessageLogListQuery = z.infer<typeof messageLogListQuerySchema>
