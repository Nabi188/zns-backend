// src/workers/zns-send.worker.ts
import { Worker } from 'bullmq'
import { redisOpts } from '@/queues/redis'
import type { ZnsSendJob } from '@/queues/queue.schema'
import { getActiveOaAccessToken } from '@/modules/zns/zns.service'
import { prisma } from '@/lib/prisma'

const ZALO_SEND_URL = 'https://business.openapi.zalo.me/message/template'

async function sendToZalo(accessToken: string, job: ZnsSendJob) {
  const res = await fetch(ZALO_SEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', access_token: accessToken },
    body: JSON.stringify({
      phone: job.phone,
      template_id: job.templateId,
      template_data: job.templateData,
      tracking_id: job.trackingId
    })
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(JSON.stringify(json))
  return json
}

export const znsSendWorker = new Worker<ZnsSendJob>(
  'zns:send',
  async (job) => {
    const { tenantId, oaIdZalo, trackingId } = job.data
    const { accessToken } = await getActiveOaAccessToken(tenantId, oaIdZalo)

    const resp = await sendToZalo(accessToken, job.data)
    const msgId =
      resp?.data?.msgId ??
      resp?.data?.message_id ??
      resp?.message_id ??
      resp?.msgId ??
      null

    await prisma.messageLog.updateMany({
      where: { tenantId, trackingId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        msgId: msgId ?? undefined,
        errorMessage: null
      }
    })

    return resp
  },
  { connection: redisOpts, concurrency: 5 }
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
