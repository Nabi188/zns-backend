// api-key.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { createApiKey, getApiKeys, updateApiKey } from './api-key.service'
import {
  CreateApiKeyRequest,
  getApiKeysQuerySchema,
  getApiKeysResponseSchema,
  updateApiKeyRequestSchema
} from './api-key.schema'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

export async function createApiKeyHandler(
  request: FastifyRequest<{ Body: CreateApiKeyRequest }>,
  reply: FastifyReply
) {
  const input = request.body

  const creatorId = 'jwt-token'
  // FIXME: CreatorID bóc từ JWT từ Middleware

  try {
    const apiKey = await createApiKey(input, creatorId)
    return reply.status(201).send(apiKey)
  } catch (error) {
    request.log.error(error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'API key already exists',
        code: 'DUPLICATE_ENTRY'
      })
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to create API key',
      code: 'INTERNAL_ERROR'
    })
  }
}

export async function getApiKeysHandler(
  request: FastifyRequest<{
    Querystring: z.infer<typeof getApiKeysQuerySchema>
  }>,
  reply: FastifyReply
) {
  const { tenantId } = request.query

  try {
    const keys = await getApiKeys(tenantId)
    const validatedKeys = getApiKeysResponseSchema.parse(keys)
    return reply.status(200).send(validatedKeys)
  } catch (error) {
    request.log.error(error)

    if (error instanceof z.ZodError) {
      request.log.error('Validation error:', error.flatten())
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to retrieve API keys',
      code: 'INTERNAL_ERROR'
    })
  }
}

export async function updateApiKeyHandler(
  request: FastifyRequest<{
    Params: { id: string }
    Body: z.infer<typeof updateApiKeyRequestSchema>
  }>,
  reply: FastifyReply
) {
  const { id } = request.params
  const data = request.body

  try {
    const updatedKey = await updateApiKey(id, data)
    return reply.status(200).send(updatedKey)
  } catch (error) {
    request.log.error(error)

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'API key not found',
        code: 'NOT_FOUND'
      })
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to update API key',
      code: 'INTERNAL_ERROR'
    })
  }
}
