// src/modules/zoa/zoa.schema.ts
import { z } from 'zod'

const oaMetaSchema = z.any().nullable().optional()

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
    createdAt: z.string(),
    oaMeta: oaMetaSchema
  }),
  templates: z.unknown().optional().nullable()
})
export type OauthExchangeResponse = z.infer<typeof oauthExchangeResponseSchema>

export const listZaloOaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  q: z.string().trim().optional()
})

export const zaloOaPublicItemSchema = z.object({
  id: z.string(),
  oaIdZalo: z.string(),
  oaName: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  oaMeta: oaMetaSchema
})

export const listZaloOaResponseSchema = z.object({
  items: z.array(zaloOaPublicItemSchema),
  meta: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number()
  })
})

export const zaloOaParamsSchema = z.object({
  oaIdZalo: z.string().min(10)
})

export const zaloOaDetailsResponseSchema = zaloOaPublicItemSchema

export const deleteZaloOaResponseSchema = z.object({
  success: z.boolean()
})
