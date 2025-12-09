// zoa.schema.ts
import { z } from 'zod'

export const zaloOaBase = z.object({
  oaIdZalo: z.string(),
  oaName: z.string(),
  accessToken: z.string(),
  refreshToken: z.string(),
  isActive: z.boolean().default(true)
})

export const createZaloOaSchema = zaloOaBase

export const updateZaloOaSchema = z.object({
  oaName: z.string().min(1).max(255).trim().optional(),
  isActive: z.boolean().optional(),
  accessToken: z.string().min(10).optional(),
  refreshToken: z.string().min(10).optional()
})

export type CreateZaloOaInput = z.infer<typeof createZaloOaSchema>
export type UpdateZaloOaInput = z.infer<typeof updateZaloOaSchema>

export const oauthExchangeSchema = z.object({
  oaIdZalo: z.string().min(10, 'oa_id invalid'),
  code: z.string().min(10, 'authorization_code invalid'),
  fetchTemplates: z.boolean().default(true),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  status: z.coerce.number().int().optional()
})
export type OauthExchangeInput = z.infer<typeof oauthExchangeSchema>

export const oauthExchangeResponseSchema = z.object({
  oa: z.object({
    id: z.string(),
    oaIdZalo: z.string(),
    oaName: z.string(),
    isActive: z.boolean(),
    createdAt: z.string()
  }),
  templates: z.unknown().optional().nullable()
})
export type OauthExchangeResponse = z.infer<typeof oauthExchangeResponseSchema>
