// api-key.schema.ts

import { z } from 'zod'

export const apiKeyBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  prefix: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.date()
})

export const createApiKeyRequestSchema = z.object({
  tenantId: z.string(),
  name: z.string().min(1, 'API Key name is required'),
  isActive: z.boolean()
})

export const createApiKeyResponseSchema = apiKeyBaseSchema.extend({
  rawKey: z.string()
})

export const getApiKeysQuerySchema = z.object({
  tenantId: z.string()
})

export const apiKeysSchema = z.array(apiKeyBaseSchema)

export type CreateApiKeyRequest = z.infer<typeof createApiKeyRequestSchema>
export type ApiKey = z.infer<typeof apiKeyBaseSchema>
export type ApiKeys = z.infer<typeof apiKeysSchema>
