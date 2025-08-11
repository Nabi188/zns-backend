// tenant.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { createTenant } from './tenant.service'
import { CreateTenantBody, CreateTenantInput } from './tenant.schema'

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
