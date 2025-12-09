// src/modules/zns/zns.service.ts
import { prisma } from '@/lib/prisma'
import { decryptToken } from '@/lib/zalo/tokens'

const ZALO_TEMPLATE_LIST_URL = 'https://business.openapi.zalo.me/template/all'
const ZALO_TEMPLATE_INFO_URL =
  'https://business.openapi.zalo.me/template/info/v2'
const ZALO_TEMPLATE_SAMPLE_URL =
  'https://business.openapi.zalo.me/template/sample-data'

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
  opts?: {
    offset?: number
    limit?: number
    status?: number
    filterPreset?: number
  }
) {
  const offset = opts?.offset ?? 0
  const limit = opts?.limit ?? 100
  const url = new URL(ZALO_TEMPLATE_LIST_URL)
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(limit))
  if (typeof opts?.status === 'number')
    url.searchParams.set('status', String(opts.status))
  if (typeof opts?.filterPreset === 'number')
    url.searchParams.set('filterPreset', String(opts.filterPreset))

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', access_token: accessToken }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const e: any = new Error(`Zalo template list failed: ${res.status} ${text}`)
    e.statusCode = res.status
    throw e
  }
  const json: any = await res.json()

  return {
    offset,
    limit,
    status: opts?.status,
    filterPreset: opts?.filterPreset,
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
  const url = new URL(ZALO_TEMPLATE_INFO_URL)
  url.searchParams.set('template_id', templateId)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', access_token: accessToken }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const e: any = new Error(`Zalo template info failed: ${res.status} ${text}`)
    e.statusCode = res.status
    throw e
  }
  const json: any = await res.json()
  return json?.data ?? {}
}

export async function fetchZnsTemplateSampleData(
  accessToken: string,
  templateId: string
) {
  const url = new URL(ZALO_TEMPLATE_SAMPLE_URL)
  url.searchParams.set('template_id', templateId)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', access_token: accessToken }
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const e: any = new Error(
      `Zalo template sample failed: ${res.status} ${text}`
    )
    e.statusCode = res.status
    throw e
  }
  const json: any = await res.json()
  return json?.data ?? {}
}

export async function syncZnsTemplates(params: {
  tenantId: string
  oaIdZalo?: string
  offset?: number
  limit?: number
  status?: number
  filterPreset?: number
}) {
  const {
    tenantId,
    oaIdZalo,
    offset = 0,
    limit = 100,
    status,
    filterPreset
  } = params
  const { accessToken, oaDbId } = await getActiveOaAccessToken(
    tenantId,
    oaIdZalo
  )
  const list = await fetchZnsTemplates(accessToken, {
    offset,
    limit,
    status,
    filterPreset
  })

  let inserted = 0
  let updated = 0

  for (const it of list.items) {
    const templateIdStr = String(it.templateId ?? it.template_id ?? '')
    if (!templateIdStr) continue

    const info = await fetchZnsTemplateInfo(accessToken, templateIdStr)
    const priceRaw = info?.price
    const priceInt =
      typeof priceRaw === 'string' || typeof priceRaw === 'number'
        ? Math.round(parseFloat(String(priceRaw))) || 0
        : 0

    const data = {
      tenantId,
      oaId: oaDbId,
      templateId: templateIdStr,
      templateName: info?.templateName ?? it.templateName ?? templateIdStr,
      status: info?.status ?? it.status ?? 'PENDING',
      isActive: statusToActive(info?.status ?? it.status),
      price: priceInt,
      listParams: info?.listParams ?? null,
      previewUrl: info?.previewUrl ?? '',
      timeout: typeof info?.timeout === 'number' ? info.timeout : 0,
      templateQuality: info?.templateQuality ?? it.templateQuality ?? null,
      templateTag: info?.templateTag ?? ''
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
    offset: list.offset,
    limit: list.limit,
    total: list.total
  }
}
