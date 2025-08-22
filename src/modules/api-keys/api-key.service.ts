// api/service.ts

import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/utils/hash'
import bcrypt from 'bcryptjs'
import { CreateApiKeyInput } from './api-key.schema'

export async function createApiKey(
  tenantId: string,
  creatorId: string,
  input: CreateApiKeyInput
) {
  const { rawKey, prefix, keyHash } = await generateApiKey()

  const apiKey = await prisma.apiKey.create({
    data: {
      tenantId,
      creatorId,
      name: input.name,
      isActive: input.isActive,
      prefix,
      keyHash
    },
    select: {
      id: true,
      tenantId: true,
      creatorId: true,
      prefix: true,
      name: true,
      isActive: true,
      createdAt: true
    }
  })

  return { ...apiKey, rawKey }
}

export async function getApiKeys(tenantId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      tenant: {
        include: {
          members: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  })

  const apiKeys = keys.map((key) => {
    const isCreatorActive = key.tenant.members.some(
      (member) => member.userId === key.creator.id
    )

    const { tenant, ...rest } = key

    return {
      ...rest,
      creator: key.creator,
      isCreatorActive: isCreatorActive
    }
  })

  return apiKeys
}

export async function updateApiKey(
  id: string,
  tenantId: string,
  data: { name?: string; isActive?: boolean }
) {
  const res = await prisma.apiKey.updateMany({
    where: { id, tenantId },
    data
  })
  if (res.count === 0) return null

  return prisma.apiKey.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      tenantId: true,
      creatorId: true,
      prefix: true,
      name: true,
      isActive: true,
      createdAt: true
    }
  })
}

export async function deleteApiKey(id: string, tenantId: string) {
  // Dùng deleteMany cho an toanf => Luôn
  const res = await prisma.apiKey.deleteMany({
    where: { id, tenantId }
  })
  return res.count
}

export async function verifyApiKey(apiKey: string) {
  const [prefix, rawKey] = apiKey.split('.')
  if (!prefix || !rawKey) throw new Error('Invalid API key format')

  const res = await prisma.apiKey.findFirst({
    where: { prefix, isActive: true }
  })
  if (!res) throw new Error('Invalid API key')

  const isValid = await bcrypt.compare(rawKey, res.keyHash)
  if (!isValid) throw new Error('Invalid API key')

  return res
}
