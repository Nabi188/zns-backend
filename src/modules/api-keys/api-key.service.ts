// api-key.service.ts

// api/service.ts

import { prisma } from '@/lib/prisma'
import { generateApiKey } from '@/utils/hash'
import bcrypt from 'bcryptjs'
import { CreateApiKeyRequest } from './api-key.schema'

export async function createApiKey(input: CreateApiKeyRequest) {
  const { rawKey, prefix, keyHash } = await generateApiKey()

  const apiKey = await prisma.apiKey.create({
    data: {
      ...input,
      prefix,
      keyHash
    }
  })

  const { keyHash: _, ...firstResponseData } = apiKey

  return {
    ...firstResponseData,
    rawKey // chỉ trả ra 1 lần duy nhất khi tạo
  }
}

export async function getApiKeys(tenantId: string) {
  const keys = await prisma.apiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      prefix: true,
      isActive: true,
      createdAt: true,
      tenantId: true
      // lastUsedAt: true
    }
  })

  return keys
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
