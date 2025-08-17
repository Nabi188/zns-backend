// tenant.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { createTenant, getTenantDetails } from './tenant.service'
import { CreateTenantBody, CreateTenantInput } from './tenant.schema'
import chalk from 'chalk'

export async function createTenantHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const ownerId = request.user.id
  const { name } = request.body as CreateTenantBody

  try {
    const tenant = await createTenant({ name, ownerId } as CreateTenantInput)
    console.log('Tenant raw:', tenant)
    return reply.code(201).send(tenant)
  } catch (e) {
    console.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to create new tenant'
    })
  }
}

export async function getTenantHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user.id
  const tenantId = request.user.tenantId

  if (!tenantId) {
    return reply.code(400).send({
      error: 'Unauthorized',
      message: 'Select a tenant before continue'
    })
  }

  try {
    const tenant = await getTenantDetails(userId, tenantId)
    // console.log('TenantDetail:', tenant)
    return reply.code(200).send(tenant)
  } catch (e) {
    chalk.red(console.log(e))
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to get tenant details'
    })
  }
}
