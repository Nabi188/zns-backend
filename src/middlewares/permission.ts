// middlewares/permission.ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { getTenantAccess } from './tenantAccess'
import { Role } from '@/lib/generated/prisma'

function permissionMiddleware(allowed: Role[], message: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const tenantId = request.user?.tenantId

    if (!tenantId) {
      return reply.status(400).send({
        error: 'Access denied',
        message: 'Select a tenant before continue'
      })
    }

    const access = await getTenantAccess(request, tenantId)
    if (!access) {
      return reply
        .status(404)
        .send({ error: 'Access denied', message: 'Access denied' })
    }

    if (!allowed.includes(access.role)) {
      return reply
        .status(403)
        .send({ error: 'Access denied', message: message })
    }

    request.tenantAccess = access
  }
}

export const checkOwner = permissionMiddleware(
  [Role.OWNER],
  'Owner permission required'
)
export const checkAdmin = permissionMiddleware(
  [Role.OWNER, Role.ADMIN],
  'Admin permission required'
)
export const checkStaff = permissionMiddleware(
  [Role.OWNER, Role.ADMIN, Role.STAFF],
  'Staff permission required'
)
// Cho phép tất cả các role: quyền thấp nhất (Dùng cho finance)
export const checkMember = permissionMiddleware(
  Object.values(Role) as Role[],
  'Member permission required'
)
