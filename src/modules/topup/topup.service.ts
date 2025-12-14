// src/modules/topup/topup.service.ts
import type { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import { envConfig } from '@/lib/envConfig'
import type { SePayWebhookPayload } from './topup.schema'

const KEY_INTENT = (memo: string) => `topup:intent:${memo}`
const KEY_DONE_ID = (id: string | number) => `sepay:done:id:${id}`
const KEY_DONE_REF = (ref: string) => `sepay:done:ref:${ref}`

function randomCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++)
    s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function createTopupIntent(
  fastify: FastifyInstance,
  params: { tenantId: string; amount: number }
) {
  const { tenantId, amount } = params
  const memoCode = `${envConfig.TOPUP_MEMO_PREFIX}-${randomCode(8)}`
  const payload = JSON.stringify({ tenantId, amount })

  await fastify.redis.setex(
    KEY_INTENT(memoCode),
    envConfig.TOPUP_INTENT_TTL_SECONDS,
    payload
  )

  return {
    memoCode,
    amount,
    bank: {
      name: String(envConfig.TOPUP_BANK_NAME),
      account: String(envConfig.TOPUP_BANK_ACCOUNT),
      accountName: 'NGUYEN THI KIM NGAN'
    },
    expiresIn: envConfig.TOPUP_INTENT_TTL_SECONDS
  }
}

function normalize(s?: string) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function extractMemoFromContent(content?: string): string | null {
  if (!content) return null
  const norm = normalize(content)
  const prefix = normalize(envConfig.TOPUP_MEMO_PREFIX).replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    '\\$&'
  )
  const re = new RegExp(`\\b${prefix}[^A-Z0-9]?([A-Z0-9]{4,})\\b`)
  const m = norm.match(re)
  if (!m) return null
  const code = m[1]
  return `${envConfig.TOPUP_MEMO_PREFIX}-${code}`
}

function iptSetBoth(
  fastify: FastifyInstance,
  payload: SePayWebhookPayload,
  value: string
) {
  const ops: Promise<any>[] = []
  ops.push(
    fastify.redis.setex(
      KEY_DONE_ID(payload.id),
      envConfig.TOPUP_IDEMPOTENCY_TTL_SECONDS,
      value
    )
  )
  if (payload.referenceCode) {
    ops.push(
      fastify.redis.setex(
        KEY_DONE_REF(String(payload.referenceCode)),
        envConfig.TOPUP_IDEMPOTENCY_TTL_SECONDS,
        value
      )
    )
  }
  return Promise.allSettled(ops)
}

async function alreadyProcessed(
  fastify: FastifyInstance,
  payload: SePayWebhookPayload
) {
  const [byId, byRef] = await Promise.all([
    fastify.redis.get(KEY_DONE_ID(payload.id)),
    payload.referenceCode
      ? fastify.redis.get(KEY_DONE_REF(String(payload.referenceCode)))
      : Promise.resolve(null)
  ])
  return Boolean(byId || byRef)
}

export async function handleSePayWebhook(
  fastify: FastifyInstance,
  payload: SePayWebhookPayload
) {
  if (String(payload.transferType || '').toLowerCase() !== 'in') {
    return { accepted: false, reason: 'not_incoming' }
  }

  const expectedAcc = String(envConfig.TOPUP_BANK_ACCOUNT || '')
  if (expectedAcc && String(payload.accountNumber || '') !== expectedAcc) {
    await iptSetBoth(fastify, payload, 'wrong_account')
    return { accepted: false, reason: 'wrong_account' }
  }
  const expectedBank = String(envConfig.TOPUP_BANK_NAME || '')
  if (expectedBank && normalize(payload.gateway) !== normalize(expectedBank)) {
    await iptSetBoth(fastify, payload, 'wrong_bank')
    return { accepted: false, reason: 'wrong_bank' }
  }

  if (await alreadyProcessed(fastify, payload)) {
    return { accepted: true, dedup: true }
  }

  const memo =
    extractMemoFromContent(payload.content) ||
    extractMemoFromContent(payload.description)
  if (!memo) {
    await iptSetBoth(fastify, payload, 'no_memo')
    return { accepted: false, reason: 'no_memo' }
  }

  const intentRaw = await fastify.redis.get(KEY_INTENT(memo))
  if (!intentRaw) {
    await iptSetBoth(fastify, payload, 'intent_not_found')
    return { accepted: false, reason: 'intent_not_found' }
  }

  const intent = JSON.parse(intentRaw) as { tenantId: string; amount: number }
  const paid = Number(payload.transferAmount) || 0
  if (paid !== Number(intent.amount)) {
    await iptSetBoth(fastify, payload, 'amount_mismatch')
    return { accepted: false, reason: 'amount_mismatch' }
  }

  const ref = String(payload.referenceCode || payload.id)

  await prisma.$transaction(async (tx) => {
    await tx.topupTransaction.create({
      data: {
        tenantId: intent.tenantId,
        amount: intent.amount,
        paymentMethod: 'SEPAY',
        paymentRef: ref,
        status: 'CONFIRMED',
        notes: payload.content ?? ''
      }
    })

    await tx.tenant.update({
      where: { id: intent.tenantId },
      data: { balance: { increment: intent.amount } }
    })
  })

  await fastify.redis.del(KEY_INTENT(memo))
  await iptSetBoth(fastify, payload, 'ok')

  return {
    accepted: true,
    tenantId: intent.tenantId,
    amount: intent.amount,
    memo
  }
}

export async function getTopupIntentStatus(
  fastify: FastifyInstance,
  params: { tenantId: string; memo: string }
) {
  const { tenantId, memo } = params
  const since = new Date(Date.now() - 10 * 60 * 1000)

  const tx = await prisma.topupTransaction.findFirst({
    where: {
      tenantId,
      status: 'CONFIRMED',
      createdAt: { gte: since },
      notes: { contains: memo }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!tx) {
    return { status: 'PENDING' as const }
  }

  return {
    status: 'SUCCESS' as const,
    amount: tx.amount,
    createdAt: tx.createdAt.toISOString()
  }
}
