//auth.controler.ts => Xử lý các request từ client

import { FastifyReply, FastifyRequest } from 'fastify'
import { createUser, findUserByEmail } from './auth.service'
import { CreateUserInput, LoginInput } from './auth.schema'
import { Prisma } from '@/lib/generated/prisma'
import { verifyPassword } from '@/utils/hash'
import { server } from '@/app'

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

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const body = request.body
  try {
    const user = await findUserByEmail(body.email)
    if (!user) {
      return reply.code(401).send({
        message: 'Invalid Email or Password!'
      })
    }
    const correctPassword = await verifyPassword(body.password, user.password)
    if (!correctPassword) {
      return reply.code(401).send({
        message: 'Invalid Email or Password!'
      })
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      tenants: user.tenants.map((t) => ({
        tenantId: t.tenant.id,
        role: t.role
      }))
    }
    const token = await server.jwt.sign(tokenPayload)

    return reply.send({ access_token: token })
  } catch (e) {
    console.error(e)

    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Login failed'
    })
  }
}

export async function meHandler() {}
