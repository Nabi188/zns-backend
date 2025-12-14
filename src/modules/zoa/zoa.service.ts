// src/modules/zoa/zoa.service.ts
import { prisma } from '@/lib/prisma'
import { encryptToken, decryptToken } from '@/lib/zalo/tokens'
import { UpdateZaloOaInput } from './zoa.schema'

export async function upsertZaloOaByToken(params: {
  tenantId: string
  oaIdZalo: string
  accessToken: string
  refreshToken: string
  oaName?: string
  oaMeta?: unknown
}) {
  const { tenantId, oaIdZalo, accessToken, refreshToken, oaName, oaMeta } =
    params

  const existing = await prisma.zaloOa.findUnique({ where: { oaIdZalo } })
  if (existing && existing.tenantId !== tenantId) {
    const e: any = new Error('oa_already_connected_to_other_tenant')
    e.statusCode = 409
    throw e
  }

  const accessTokenEnc = encryptToken(accessToken)
  const refreshTokenEnc = encryptToken(refreshToken)

  if (!existing) {
    return prisma.zaloOa.create({
      data: {
        tenantId,
        oaIdZalo,
        oaName: oaName ?? oaIdZalo,
        accessToken: accessTokenEnc,
        refreshToken: refreshTokenEnc,
        isActive: true,
        oaMeta: oaMeta ?? undefined
      }
    })
  }

  return prisma.zaloOa.update({
    where: { oaIdZalo },
    data: {
      oaName: oaName ?? existing.oaName ?? oaIdZalo,
      accessToken: accessTokenEnc,
      refreshToken: refreshTokenEnc,
      isActive: true,
      oaMeta: oaMeta ?? undefined
    }
  })
}

export function getZaloOaById(tenantId: string, id: string) {
  return prisma.zaloOa.findFirst({ where: { id, tenantId } })
}

export async function updateZaloOa(
  tenantId: string,
  id: string,
  data: UpdateZaloOaInput
) {
  const existing = await prisma.zaloOa.findFirst({ where: { id, tenantId } })
  if (!existing) {
    const e: any = new Error('not_found')
    e.statusCode = 404
    throw e
  }

  const payload: any = {}
  if (data.oaName !== undefined) payload.oaName = data.oaName
  if (typeof data.isActive === 'boolean') payload.isActive = data.isActive
  if (data.accessToken) payload.accessToken = encryptToken(data.accessToken)
  if (data.refreshToken) payload.refreshToken = encryptToken(data.refreshToken)

  return prisma.zaloOa.update({ where: { id }, data: payload })
}

export async function setZaloOaActive(
  tenantId: string,
  id: string,
  isActive: boolean
) {
  const existing = await prisma.zaloOa.findFirst({ where: { id, tenantId } })
  if (!existing) {
    const e: any = new Error('not_found')
    e.statusCode = 404
    throw e
  }
  return prisma.zaloOa.update({ where: { id }, data: { isActive } })
}

export async function deleteZaloOa(tenantId: string, id: string) {
  const existing = await prisma.zaloOa.findFirst({ where: { id, tenantId } })
  if (!existing) {
    const e: any = new Error('not_found')
    e.statusCode = 404
    throw e
  }
  await prisma.zaloOa.delete({ where: { id } })
}

export async function getDecryptedTokens(tenantId: string, id: string) {
  const oa = await prisma.zaloOa.findFirst({
    where: { id, tenantId },
    select: { accessToken: true, refreshToken: true }
  })
  if (!oa) {
    const e: any = new Error('not_found')
    e.statusCode = 404
    throw e
  }
  return {
    accessToken: decryptToken(oa.accessToken),
    refreshToken: decryptToken(oa.refreshToken)
  }
}

export async function listZaloOa(params: {
  tenantId: string
  isActive?: boolean
  q?: string
  page?: number
  pageSize?: number
}) {
  const { tenantId, isActive, q } = params
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))

  const where: any = { tenantId }
  if (typeof isActive === 'boolean') where.isActive = isActive
  if (q)
    where.OR = [
      { oaName: { contains: q, mode: 'insensitive' } },
      { oaIdZalo: { contains: q } }
    ]

  const [itemsRaw, total] = await Promise.all([
    prisma.zaloOa.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        oaIdZalo: true,
        oaName: true,
        isActive: true,
        createdAt: true,
        oaMeta: true
      }
    }),
    prisma.zaloOa.count({ where })
  ])

  const items = itemsRaw.map((x) => ({
    id: x.id,
    oaIdZalo: x.oaIdZalo,
    oaName: x.oaName,
    isActive: x.isActive,
    createdAt: x.createdAt.toISOString()
  }))

  return { items, total, page, pageSize }
}

export async function getZaloOaByOaIdZalo(tenantId: string, oaIdZalo: string) {
  const oa = await prisma.zaloOa.findFirst({
    where: { tenantId, oaIdZalo },
    select: {
      id: true,
      oaIdZalo: true,
      oaName: true,
      isActive: true,
      createdAt: true
    }
  })
  return oa
}

export async function deleteZaloOaByOaIdZalo(
  tenantId: string,
  oaIdZalo: string
) {
  const existing = await prisma.zaloOa.findFirst({
    where: { tenantId, oaIdZalo }
  })
  if (!existing) {
    const e: any = new Error('not_found')
    e.statusCode = 404
    throw e
  }

  const logCount = await prisma.messageLog.count({
    where: { tenantId, zaloOaId: oaIdZalo }
  })
  if (logCount > 0) {
    const e: any = new Error('oa_has_messages')
    e.statusCode = 409
    throw e
  }

  await prisma.zaloOa.delete({ where: { id: existing.id } })
  return { success: true }
}
