// user.controller.ts => Xử lý logic các route

import { FastifyReply, FastifyRequest } from 'fastify'
import { createUser, findUserByEmail } from './user.service'
import { CreateUserInput, LoginInput } from './user.schema'
import { Prisma } from '@/lib/generated/prisma'
import { verifyPassword } from '@/utils/hash'
import { server } from '@/app'

export async function registerUserHandler(
  request: FastifyRequest<{ Body: CreateUserInput }>,
  reply: FastifyReply
) {
  const body = request.body

  try {
    //Logic hash mật khẩu ở trong trong user.service.ts
    const user = await createUser(body)
    return reply.code(201).send(user)
  } catch (e) {
    console.log(e)

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

    const { password, ...rest } = user

    const token = server.jwt.sign(rest)
    return reply.send({ access_token: token })
  } catch (e) {
    console.error(e)

    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Login failed'
    })
  }
}
