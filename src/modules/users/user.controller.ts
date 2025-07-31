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
    console.log(user)
    if (!user) {
      return reply.code(401).send({
        message: 'Invalid Email or Password!'
      })
    }

    const correctPassword = verifyPassword({
      candidatePassword: body.password,
      salt: user.salt,
      hash: user.password
    })

    if (!correctPassword) {
      return reply.code(401).send({
        message: 'Invalid Email or Password!'
      })
    }

    const { password, salt, ...rest } = user

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
