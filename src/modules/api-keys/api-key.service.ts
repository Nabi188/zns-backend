// api/service.ts

import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/utils/hash'
import bcrypt from 'bcryptjs'
import { CreateApiKeyRequest } from './api-key.schema'

export async function createApiKey(
  input: CreateApiKeyRequest,
  creatorId: string
) {
  const { rawKey, prefix, keyHash } = await generateApiKey()

  const apiKey = await prisma.apiKey.create({
    data: {
      ...input,
      creatorId,
      prefix,
      keyHash
    }
  })

  const { keyHash: _, ...firstResponseData } = apiKey

  return {
    ...firstResponseData,
    rawKey
  }
}

export async function getApiKeys(tenantId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: {
          id: true,
          fullName: true
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
    // Check xem còn ở trong tổ chức ko? Nếu ko thì cảnh báo trên FE
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
  data: { name?: string; isActive?: boolean }
) {
  const updatedKey = await prisma.apiKey.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      createdAt: true,
      tenantId: true,
      creatorId: true
    }
  })
  return updatedKey
}

export async function deleteApiKey(id: string) {
  const deletedKey = await prisma.apiKey.delete({
    where: { id },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      createdAt: true,
      tenantId: true,
      creatorId: true
    }
  })
  return deletedKey
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
