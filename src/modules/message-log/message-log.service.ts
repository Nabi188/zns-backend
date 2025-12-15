import { prisma } from '@/lib/prisma'
import type { MessageLogListQuery } from './message-log.schema'

export async function listMessageLogs(params: {
  tenantId: string
  query: MessageLogListQuery
}) {
  const { tenantId, query } = params
  const { page, pageSize, status, phone, trackingId, q, from, to } = query

  const where: any = { tenantId }

  if (status) where.status = status
  if (phone) where.recipientPhone = { contains: phone }
  if (trackingId) where.trackingId = { contains: trackingId }

  if (q) {
    where.OR = [
      { recipientPhone: { contains: q } },
      { trackingId: { contains: q } },
      { templateId: { contains: q } }
    ]
  }

  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }

  const [total, rows] = await Promise.all([
    prisma.messageLog.count({ where }),
    prisma.messageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        messageCharge: { select: { amount: true } },
        template: { select: { templateName: true } }
      }
    })
  ])

  return {
    items: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      recipientPhone: r.recipientPhone,
      templateId: r.templateId,
      templateName: r.template?.templateName ?? '',
      templateData: r.templateData,
      status: r.status,
      msgId: r.msgId,
      errorMessage: r.errorMessage,
      amount: r.messageCharge?.amount ?? null
    })),
    meta: {
      total,
      page,
      pageSize
    }
  }
}
