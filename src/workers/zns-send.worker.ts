import { Worker } from 'bullmq'
import { redisOpts } from '@/queues/redis'
import type { ZnsSendJob } from '@/queues/queue.schema'
import { getActiveOaAccessToken } from '@/modules/zns/zns.service'
import { prisma } from '@/lib/prisma'

const ZALO_SEND_URL = 'https://business.openapi.zalo.me/message/template'

async function sendToZalo(accessToken: string, job: ZnsSendJob) {
  const res = await fetch(ZALO_SEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: accessToken
    },
    body: JSON.stringify({
      phone: job.phone,
      template_id: job.templateId,
      template_data: job.templateData,
      tracking_id: job.trackingId
    })
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(JSON.stringify(json))
  }
  return json
}

export const znsSendWorker = new Worker<ZnsSendJob>(
  'zns-send',
  async (job) => {
    const { tenantId, oaIdZalo, trackingId, templateId } = job.data

    const tpl = await prisma.znsTemplate.findUnique({
      where: { templateId },
      select: { price: true }
    })

    const baseZnsFee = Number(tpl?.price ?? 0)
    const deliveryFee = 0
    const platformFee = 100
    const preVat = baseZnsFee + deliveryFee + platformFee
    const vatAmount = Math.round(preVat * 0.1)
    const amount = preVat + vatAmount

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { balance: true }
    })

    if (!tenant || tenant.balance < amount) {
      await prisma.messageLog.updateMany({
        where: { tenantId, trackingId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: 'INSUFFICIENT_BALANCE'
        }
      })
      throw new Error('INSUFFICIENT_BALANCE')
    }

    const { accessToken } = await getActiveOaAccessToken(tenantId, oaIdZalo)

    const resp = await sendToZalo(accessToken, job.data)

    console.log('[ZALO RESPONSE]', {
      trackingId,
      templateId,
      phone: job.data.phone,
      resp
    })

    if (resp?.error !== 0) {
      await prisma.messageLog.updateMany({
        where: { tenantId, trackingId },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          errorMessage: JSON.stringify(resp)
        }
      })
      throw new Error(`ZALO_ERROR_${resp?.error}`)
    }

    const msgId: string | null = resp?.data?.msg_id ?? null

    await prisma.$transaction(async (tx) => {
      await tx.messageLog.updateMany({
        where: { tenantId, trackingId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          msgId,
          errorMessage: null
        }
      })

      const log = await tx.messageLog.findFirst({
        where: { tenantId, trackingId },
        select: { id: true }
      })
      if (!log) return

      await tx.messageCharge.upsert({
        where: { messageLogId: log.id },
        update: {
          amount,
          baseZnsFee,
          deliveryFee,
          platformFee,
          vatAmount,
          status: 'CONFIRMED'
        },
        create: {
          tenantId,
          messageLogId: log.id,
          amount,
          baseZnsFee,
          deliveryFee,
          platformFee,
          vatAmount,
          status: 'CONFIRMED'
        }
      })

      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          balance: { decrement: amount }
        }
      })
    })

    return resp
  },
  {
    connection: redisOpts,
    concurrency: 5
  }
)

znsSendWorker.on('failed', async (job, err) => {
  if (!job) return
  const { tenantId, trackingId } = job.data

  await prisma.messageLog.updateMany({
    where: { tenantId, trackingId },
    data: {
      status: 'FAILED',
      failedAt: new Date(),
      errorMessage: String(err?.message || err)
    }
  })
})
