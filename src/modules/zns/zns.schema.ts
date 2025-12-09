// src/modules/zns/zns.schema.ts
import { z } from 'zod'

export const zaloTemplateItemSchema = z.object({}).passthrough()

export const znsListQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  status: z.coerce.number().int().optional(),
  filterPreset: z.coerce.number().int().optional(),
  oaIdZalo: z.string().optional()
})

export const znsDetailParamsSchema = z.object({
  templateId: z.string().min(1)
})

export const znsSyncQuerySchema = znsListQuerySchema

export const znsListResponseSchema = z.object({
  offset: z.number(),
  limit: z.number(),
  status: z.number().optional(),
  filterPreset: z.number().optional(),
  total: z.number().default(0),
  items: z.array(zaloTemplateItemSchema)
})

export const znsDetailResponseSchema = z.object({
  template: z.unknown()
})

export const znsSampleDataResponseSchema = z.object({
  sampleData: z.unknown()
})

export const znsSyncResponseSchema = z.object({
  synced: z.number(),
  inserted: z.number(),
  updated: z.number(),
  offset: z.number(),
  limit: z.number(),
  total: z.number()
})

export type ZnsListQuery = z.infer<typeof znsListQuerySchema>
export type ZnsSyncQuery = z.infer<typeof znsSyncQuerySchema>
