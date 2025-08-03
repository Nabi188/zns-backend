// api-key.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { createApiKey, getApiKeys } from './api-key.service'
import { CreateApiKeyRequest, getApiKeysQuerySchema } from './api-key.schema'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

export async function createApiKeyHandler(
  request: FastifyRequest<{ Body: CreateApiKeyRequest }>,
  reply: FastifyReply
) {
  const input = request.body

  try {
    const apiKey = await createApiKey(input)
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
    return reply.status(200).send(keys)
  } catch (error) {
    request.log.error(error)

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to retrieve API keys',
      code: 'INTERNAL_ERROR'
    })
  }
}
