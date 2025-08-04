//auth.controler.ts => Xử lý các request từ client

import { FastifyReply, FastifyRequest } from 'fastify'
import { createUser, findUserByEmail, findUserTenant } from './auth.service'
import { CreateUserInput, LoginInput, SelectTenantInput } from './auth.schema'
import { Prisma } from '@/lib/generated/prisma'
import { verifyPassword } from '@/utils/hash'
import { server } from '@/app'
import { envConfig } from '@/lib/envConfig'

export async function registerUserHandler(
  request: FastifyRequest<{ Body: CreateUserInput }>,
  reply: FastifyReply
) {
  const body = request.body

  try {
    const user = await createUser(body)
    return reply.code(201).send(user)
  } catch (e) {
    console.error(e)

    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Email already exists'
        })
      }
    }

    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to create user'
    })
  }
}

// export async function loginHandler(
//   request: FastifyRequest<{ Body: LoginInput }>,
//   reply: FastifyReply
// ) {
//   const body = request.body
//   try {
//     const user = await findUserByEmail(body.email)
//     if (!user) {
//       return reply.code(401).send({
//         message: 'Invalid Email or Password!'
//       })
//     }
//     const correctPassword = await verifyPassword(body.password, user.password)
//     if (!correctPassword) {
//       return reply.code(401).send({
//         message: 'Invalid Email or Password!'
//       })
//     }

//     // Generate JWT token
//     const tokenPayload = {
//       id: user.id,
//       email: user.email,
//       fullName: user.fullName,
//       tenants: user.tenants.map((t) => ({
//         tenantId: t.tenant.id,
//         role: t.role
//       }))
//     }
//     const token = await server.jwt.sign(tokenPayload)

//     return reply.send({ access_token: token })
//   } catch (e) {
//     console.error(e)

//     return reply.code(500).send({
//       error: 'Internal server error',
//       message: 'Login failed'
//     })
//   }
// }

// > Chuyển sang dùng Cookie để xử lý cho gọn
export async function loginHandler(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const body = request.body
  try {
    const user = await findUserByEmail(body.email)
    if (!user) {
      return reply.code(401).send({ message: 'Invalid Email or Password!' })
    }

    const correctPassword = await verifyPassword(body.password, user.password)
    if (!correctPassword) {
      return reply.code(401).send({ message: 'Invalid Email or Password!' })
    }

    // JWT lúc đầu chỉ chứa userId và email thôi > Chọn tenant cập nhật lại JWT mới
    const tokenPayload = {
      id: user.id,
      email: user.email
    }

    const token = await server.jwt.sign(tokenPayload)

    reply.setCookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain:
        envConfig.NODE_ENV === 'production'
          ? envConfig.FRONTEND_DOMAIN
          : undefined,
      maxAge: envConfig.JWT_MAX_AGE
    })

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName
      },
      tenants: user.tenants.map((t) => ({
        tenantId: t.tenant.id,
        name: t.tenant.name,
        role: t.role
      }))
    })
  } catch (e) {
    console.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Login failed'
    })
  }
}

export async function selectTenantHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user
  const { tenantId } = request.body as SelectTenantInput

  try {
    const tenant = await findUserTenant(user.id, tenantId)
    if (!tenant) {
      return reply.code(403).send({ message: 'Access denied' })
    }

    const newToken = await request.server.jwt.sign({
      id: user.id,
      email: user.email,
      tenantId,
      role: tenant.role
    })

    reply.setCookie('token', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain:
        envConfig.NODE_ENV === 'production'
          ? envConfig.FRONTEND_DOMAIN
          : undefined,
      maxAge: envConfig.JWT_MAX_AGE
    })

    return reply.send({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        currentTenant: {
          tenantId,
          name: tenant.tenant.name,
          role: tenant.role
        }
      }
    })
  } catch (e) {
    console.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Select tenant failed'
    })
  }
}

// TODO: Làm me handler
export async function meHandler() {}
