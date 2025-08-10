//auth.controler.ts => Xử lý các request từ client

import { FastifyReply, FastifyRequest } from 'fastify'
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserTenant
} from './auth.service'
import {
  CreateUserInput,
  createUserResponseSchema,
  LoginInput,
  SelectTenantInput
} from './auth.schema'
import { verifyPassword } from '@/utils/hash'
import { server } from '@/app'
import { clearAuthCookie, setAuthCookie } from '@/lib/authCookie'
import { getTenantsById } from '../tenants/tenant.service'
import { sendVerificationOTP, verifyOTP } from './verification.service'
import { SendOtpInput, VerifyOtpInput } from './verification.schema'

export async function registerUserHandler(
  request: FastifyRequest<{ Body: CreateUserInput }>,
  reply: FastifyReply
) {
  const body = request.body

  try {
    const existingUser = await findUserByEmail(body.email)
    if (existingUser) {
      return reply.code(409).send({
        error: 'Conflict',
        message: 'Email already exists'
      })
    }

    const user = await createUser(body)

    const { password, ...createdUser } = user
    // console.log(createdUser)

    return reply.code(201).send(createdUser)
  } catch (e) {
    console.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to create user'
    })
  }
}

// > Chuyển sang dùng Cookie để xử lý cho gọn
export async function loginHandler(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const body = request.body
  try {
    const user = await findUserByEmail(body.email)

    // gom logic check user và password
    if (!user || !(await verifyPassword(body.password, user.password))) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid Email or Password!'
      })
    }

    // JWT lúc đầu chỉ chứa userId và email thôi > Chọn tenant cập nhật lại JWT mới
    const tokenPayload = {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified
    }

    const token = await server.jwt.sign(tokenPayload)

    setAuthCookie(reply, token)

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      tenants: user.tenants.map((t) => ({
        tenantId: t.tenant.id,
        name: t.tenant.name,
        role: t.role,
        createdAt: t.tenant.createdAt,
        updatedAt: t.tenant.updatedAt
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

export async function sendOTPHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { id, email } = request.user

  const result = await sendVerificationOTP(request.server, id, email)

  if (result?.error) {
    return reply
      .code(Number(result.error) || 400)
      .send({ error: result.error, message: result.message })
  }

  return reply.code(200).send(result)
}

export async function verifyOTPHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { otp } = request.body as VerifyOtpInput

  const ok = await verifyOTP(request.server, request.user.id, otp)

  if (!ok) {
    return reply
      .code(400)
      .send({ error: 'Invalid OTP', message: 'Invalid or expired OTP' })
  }

  // tạo JWT mới với isVerified = true
  const newToken = await request.server.jwt.sign({
    ...request.user,
    isVerified: true
  })
  setAuthCookie(reply, newToken)

  return reply.code(200).send({ message: 'Email verified successfully' })
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

    const token = await request.server.jwt.sign({
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      tenantId,
      role: tenant.role
    })

    setAuthCookie(reply, token)

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

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user

  try {
    // Luông phải kiểm tra xem user còn nằm trong tenant không, tránh trương f hợp user bị xoá khỏi tenant rồi mà cookie vẫn còn hạn > Vẫn xem được dữ liệu
    if (user.tenantId) {
      const isMember = await findUserTenant(user.id, user.tenantId)
      if (!isMember) {
        return reply.code(403).send({
          error: 'Forbidden',
          message: 'User is no longer a member of the current tenant'
        })
      }
    }

    const fullUser = await findUserById(user.id)

    if (!fullUser) {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'User not found'
      })
    }

    if (!fullUser.isVerified) {
      return reply.code(403).send({
        error: 'Not Verified',
        message: 'Please verify your email before continuing'
      })
    }

    const currentTenant = user.tenantId
      ? await getTenantsById(user.tenantId, user.id)
      : null

    return reply.send({
      ...fullUser,
      currentTenant,
      tenants: fullUser.tenants.map((t) => ({
        id: t.tenant.id,
        name: t.tenant.name,
        role: t.role,
        createdAt: t.tenant.createdAt,
        updatedAt: t.tenant.updatedAt
      }))
    })
  } catch (e) {
    console.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to get user data'
    })
  }
}

export async function logoutHandler(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    clearAuthCookie(reply)

    return reply.code(200).send({ message: 'Logout successful' })
  } catch (e) {
    console.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to log out'
    })
  }
}
