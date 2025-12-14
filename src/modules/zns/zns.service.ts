// src/modules/zns/zns.service.ts
import { prisma } from '@/lib/prisma'
import { decryptToken } from '@/lib/zalo/tokens'
import {
  zaloListTemplates,
  zaloGetTemplateInfo,
  zaloGetTemplateSample
} from './zns.client'

function statusToActive(status?: string) {
  const s = String(status ?? '').toUpperCase()
  return s === 'ENABLE' || s === 'APPROVED' || s === 'ACTIVE'
}

export async function getActiveOaAccessToken(
  tenantId: string,
  oaIdZalo?: string
) {
  if (oaIdZalo) {
    const oa = await prisma.zaloOa.findFirst({
      where: { tenantId, oaIdZalo, isActive: true },
      select: { id: true, accessToken: true }
    })
    if (!oa) {
      const e: any = new Error('not_found')
      e.statusCode = 404
      throw e
    }
    return { accessToken: decryptToken(oa.accessToken), oaDbId: oa.id }
  }

  const oas = await prisma.zaloOa.findMany({
    where: { tenantId, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, accessToken: true }
  })
  if (oas.length === 0) {
    const e: any = new Error('not_found')
    e.statusCode = 404
    throw e
  }
  if (oas.length > 1) {
    const e: any = new Error('multiple_oas_choose_one')
    e.statusCode = 400
    throw e
  }

  const chosen = oas[0]
  return { accessToken: decryptToken(chosen.accessToken), oaDbId: chosen.id }
}

export async function fetchZnsTemplates(
  accessToken: string,
  opts?: { offset?: number; limit?: number }
) {
  const offset = opts?.offset ?? 0
  const limit = opts?.limit ?? 100

  const json: any = await zaloListTemplates(accessToken, { offset, limit })
  return {
    offset,
    limit,
    total:
      json?.metadata?.total ??
      (Array.isArray(json?.data) ? json.data.length : 0),
    items: Array.isArray(json?.data) ? json.data : []
  }
}

export async function fetchZnsTemplateInfo(
  accessToken: string,
  templateId: string
) {
  const json: any = await zaloGetTemplateInfo(accessToken, templateId)
  return json?.data ?? {}
}

export async function fetchZnsTemplateSampleData(
  accessToken: string,
  templateId: string
) {
  const json: any = await zaloGetTemplateSample(accessToken, templateId)
  return json?.data ?? {}
}

export async function syncZnsTemplates(params: {
  tenantId: string
  oaIdZalo?: string
  offset?: number
  limit?: number
}) {
  const { tenantId, oaIdZalo, offset = 0, limit = 100 } = params
  const { accessToken, oaDbId } = await getActiveOaAccessToken(
    tenantId,
    oaIdZalo
  )

  const listJson = await zaloListTemplates(accessToken, { offset, limit })
  const items: any[] = Array.isArray(listJson?.data) ? listJson.data : []
  const total: number =
    typeof listJson?.metadata?.total === 'number'
      ? listJson.metadata.total
      : items.length

  let inserted = 0
  let updated = 0

  for (const it of items) {
    const templateIdStr = String(it.templateId ?? it.template_id ?? '')
    if (!templateIdStr) continue

    const [infoRes, sampleRes] = await Promise.allSettled([
      zaloGetTemplateInfo(accessToken, templateIdStr),
      zaloGetTemplateSample(accessToken, templateIdStr)
    ])

    const info =
      infoRes.status === 'fulfilled' ? (infoRes.value?.data ?? {}) : {}
    const sampleData =
      sampleRes.status === 'fulfilled' ? (sampleRes.value?.data ?? null) : null

    const priceRaw = info?.price
    const priceInt =
      typeof priceRaw === 'string' || typeof priceRaw === 'number'
        ? Math.round(parseFloat(String(priceRaw))) || 0
        : 0

    const statusStr = String(info?.status ?? it.status ?? '').toUpperCase()
    const isActive =
      statusStr === 'ENABLE' ||
      statusStr === 'APPROVED' ||
      statusStr === 'ACTIVE'

    const data = {
      tenantId,
      oaId: oaDbId,
      templateId: templateIdStr,
      templateName: info?.templateName ?? it.templateName ?? templateIdStr,
      status: info?.status ?? it.status ?? 'PENDING',
      isActive,
      price: priceInt,
      listParams: info?.listParams ?? null,
      previewUrl: info?.previewUrl ?? '',
      timeout: typeof info?.timeout === 'number' ? info.timeout : 0,
      templateQuality: info?.templateQuality ?? it.templateQuality ?? null,
      templateTag: info?.templateTag ?? '',
      sampleData
    }

    const exists = await prisma.znsTemplate.findUnique({
      where: { templateId: templateIdStr }
    })
    if (!exists) {
      await prisma.znsTemplate.create({ data })
      inserted++
    } else {
      await prisma.znsTemplate.update({
        where: { templateId: templateIdStr },
        data
      })
      updated++
    }
  }

  return {
    synced: inserted + updated,
    inserted,
    updated,
    offset,
    limit,
    total
  }
}
