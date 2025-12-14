import { z } from 'zod'

export const createTopupIntentSchema = z.object({
  amount: z.number().int().positive()
})
export type CreateTopupIntentInput = z.infer<typeof createTopupIntentSchema>

export const topupIntentResponseSchema = z.object({
  memoCode: z.string(),
  amount: z.number(),
  bank: z.object({
    name: z.string(),
    account: z.string(),
    accountName: z.string()
  }),
  expiresIn: z.number()
})
export type TopupIntentResponse = z.infer<typeof topupIntentResponseSchema>

export const sepayWebhookPayloadSchema = z.object({
  id: z.number(),
  gateway: z.string().optional(),
  transactionDate: z.string().optional(),
  accountNumber: z.string().optional(),
  code: z.string().nullable().optional(),
  content: z.string().optional(),
  transferType: z.string(),
  transferAmount: z.number(),
  accumulated: z.number().optional(),
  subAccount: z.any().nullable().optional(),
  referenceCode: z.string().optional(),
  description: z.string().optional()
})
export type SePayWebhookPayload = z.infer<typeof sepayWebhookPayloadSchema>

export const topupIntentStatusQuerySchema = z.object({
  memo: z.string().min(4)
})

export const topupIntentStatusResponseSchema = z.object({
  status: z.enum(['PENDING', 'SUCCESS']),
  amount: z.number().optional(),
  createdAt: z.string().optional()
})

export type TopupIntentStatusQuery = z.infer<
  typeof topupIntentStatusQuerySchema
>
export type TopupIntentStatusResponse = z.infer<
  typeof topupIntentStatusResponseSchema
>
