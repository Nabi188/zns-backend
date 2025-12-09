// src/modules/public-zns/public-zns.service.ts
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getActiveOaAccessToken } from '@/modules/zns/zns.service'

const ZALO_SEND_URL = 'https://business.openapi.zalo.me/message/template'

export async function verifyApiKey(rawKey?: string) {
  if (!rawKey) {
    const e: any = new Error('invalid_api_key')
    e.statusCode = 401
    throw e
  }
  const prefix = rawKey.slice(0, 8)
  const found = await prisma.apiKey.findFirst({
    where: { prefix, isActive: true },
    select: { id: true, tenantId: true, keyHash: true }
  })
  if (!found) {
    const e: any = new Error('invalid_api_key')
    e.statusCode = 401
    throw e
  }
  const ok = await bcrypt.compare(rawKey, found.keyHash)
  if (!ok) {
    const e: any = new Error('invalid_api_key')
    e.statusCode = 401
    throw e
  }
  return { tenantId: found.tenantId, apiKeyId: found.id }
}

export async function ensureTemplateExists(
  tenantId: string,
  templateId: string
) {
  const tpl = await prisma.znsTemplate.findUnique({
    where: { templateId },
    select: { id: true, tenantId: true }
  })
  if (!tpl || tpl.tenantId !== tenantId) {
    const e: any = new Error('template_not_found')
    e.statusCode = 404
    throw e
  }
}

export async function sendZnsViaZalo(
  accessToken: string,
  payload: {
    phone: string
    template_id: string
    template_data: Record<string, any>
    tracking_id: string
  }
) {
  const res = await fetch(ZALO_SEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: accessToken
    },
    body: JSON.stringify(payload)
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e: any = new Error('zalo_upstream_error')
    e.statusCode = 502
    e.payload = json
    throw e
  }
  return json
}

export async function publicSend(opts: {
  apiKey: string
  body: {
    templateId: string
    phone: string
    templateData: Record<string, any>
    trackingId: string
    oaIdZalo?: string
  }
}) {
  const { tenantId } = await verifyApiKey(opts.apiKey)
  await ensureTemplateExists(tenantId, opts.body.templateId)
  const { accessToken } = await getActiveOaAccessToken(
    tenantId,
    opts.body.oaIdZalo
  )

  const zaloResp = await sendZnsViaZalo(accessToken, {
    phone: opts.body.phone,
    template_id: opts.body.templateId,
    template_data: opts.body.templateData,
    tracking_id: opts.body.trackingId
  })

  return { status: 'SENT' as const, zalo: zaloResp }
}
