// api-key.schema.ts

import { z } from 'zod'

export const apiKeyBaseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  creatorId: z.string(),
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

// Không dùng schema của user vì bảo mật => Không hiện email và điện thoại cho người khác
export const apiKeyCreatorSchema = z.object({
  id: z.string(),
  fullName: z.string()
})

export const apiKeyWithCreatorSchema = apiKeyBaseSchema
  .omit({ creatorId: true }) // omit creatorId vì trong mảng create có rồi
  .extend({
    creator: apiKeyCreatorSchema,
    isCreatorActive: z.boolean()
  })

export const getApiKeysResponseSchema = z.array(apiKeyWithCreatorSchema)

export const updateApiKeyRequestSchema = z.object({
  name: z.string().min(1, 'API Key name is required').optional(),
  isActive: z.boolean().optional()
})

export const updateApiKeyParamsSchema = z.object({
  id: z.string()
})

export type CreateApiKeyRequest = z.infer<typeof createApiKeyRequestSchema>
export type ApiKey = z.infer<typeof apiKeyBaseSchema>
export type GETApiKeysInput = z.infer<typeof getApiKeysQuerySchema>
export type GetApiKeysResponse = z.infer<typeof getApiKeysResponseSchema>
export type UpdateApiKeyRequest = z.infer<typeof updateApiKeyRequestSchema>
export type UpdateApiKeyParams = z.infer<typeof updateApiKeyParamsSchema>
