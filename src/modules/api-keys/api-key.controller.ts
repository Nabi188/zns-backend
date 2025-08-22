// api-key.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import {
  createApiKey,
  deleteApiKey,
  getApiKeys,
  updateApiKey
} from './api-key.service'
import {
  CreateApiKeyInput,
  UpdateApiKeyInput,
  UpdateApiKeyParams
} from './api-key.schema'

export async function createApiKeyHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const input = request.body as CreateApiKeyInput
  const creatorId = request.user.id
  const tenantId = request.tenantAccess?.tenantId

  if (!tenantId) {
    return reply.status(400).send({
      error: 'BadRequest',
      message: 'Select a tenant before continuing'
    })
  }

  try {
    const apiKey = await createApiKey(tenantId, creatorId, input)
    return reply.status(200).send(apiKey)
  } catch (error) {
    request.log.error(error)

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to create API key'
    })
  }
}

export async function getApiKeysHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const tenantId = request.tenantAccess?.tenantId
  if (!tenantId) {
    return reply.status(400).send({
      error: 'BadRequest',
      message: 'Select a tenant before continuing'
    })
  }
  try {
    const keys = await getApiKeys(tenantId)
    return reply.status(200).send(keys)
  } catch (error) {
    request.log.error(error)

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to retrieve API keys'
    })
  }
}

export async function updateApiKeyHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as { id: string }
  const tenantId = request.tenantAccess?.tenantId
  const data = request.body as UpdateApiKeyInput

  if (!tenantId) {
    return reply.status(400).send({
      error: 'BadRequest',
      message: 'Select a tenant before continuing'
    })
  }

  try {
    const updatedKey = await updateApiKey(id, tenantId, data)
    if (!updatedKey) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'API key not found'
      })
    }
    return reply.status(200).send(updatedKey)
  } catch (error) {
    request.log.error(error)
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to update API key'
    })
  }
}

export async function deleteApiKeyHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id } = request.params as UpdateApiKeyParams
  const tenantId = request.tenantAccess?.tenantId as string
  try {
    await deleteApiKey(id, tenantId)
    return reply.status(200).send({ message: 'Delete API key successful' })
  } catch (e) {
    request.log.error(e)
  }
}
