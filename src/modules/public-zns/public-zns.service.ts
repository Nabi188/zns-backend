// src/modules/public-zns/public-zns.service.ts
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { znsSendQueue } from '@/queues/zns-send.queue'

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
    select: { tenantId: true }
  })
  if (!tpl || tpl.tenantId !== tenantId) {
    const e: any = new Error('template_not_found')
    e.statusCode = 404
    throw e
  }
}

async function chooseOaIdZalo(
  tenantId: string,
  oaIdZalo?: string
): Promise<string> {
  if (oaIdZalo) {
    const ok = await prisma.zaloOa.findFirst({
      where: { tenantId, oaIdZalo, isActive: true },
      select: { oaIdZalo: true }
    })
    if (!ok) {
      const e: any = new Error('not_found')
      e.statusCode = 404
      throw e
    }
    return oaIdZalo
  }
  const list = await prisma.zaloOa.findMany({
    where: { tenantId, isActive: true },
    select: { oaIdZalo: true }
  })
  if (list.length === 0) {
    const e: any = new Error('not_found')
    e.statusCode = 404
    throw e
  }
  if (list.length > 1) {
    const e: any = new Error('multiple_oas_choose_one')
    e.statusCode = 400
    throw e
  }
  return list[0].oaIdZalo
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
  const chosenOaIdZalo = await chooseOaIdZalo(tenantId, opts.body.oaIdZalo)

  try {
    await prisma.messageLog.create({
      data: {
        tenantId,
        zaloOaId: chosenOaIdZalo,
        templateId: opts.body.templateId,
        recipientPhone: opts.body.phone,
        trackingId: opts.body.trackingId,
        status: 'PENDING',
        deliverySpeed: 'NORMAL',
        templateData: opts.body.templateData
      }
    })
  } catch {
    await prisma.messageLog.updateMany({
      where: { tenantId, trackingId: opts.body.trackingId },
      data: { status: 'PENDING', deliverySpeed: 'NORMAL' }
    })
  }

  const job = {
    tenantId,
    oaIdZalo: chosenOaIdZalo,
    templateId: opts.body.templateId,
    phone: opts.body.phone,
    templateData: opts.body.templateData,
    trackingId: opts.body.trackingId
  }

  try {
    await znsSendQueue.add('send', job, {
      jobId: job.trackingId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 200
    })
  } catch {
    // jobID đã tồn tại
  }

  return { status: 'QUEUED' as const, trackingId: opts.body.trackingId }
}
