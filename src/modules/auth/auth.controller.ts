//auth.controler.ts => Xử lý các request từ client

import { FastifyReply, FastifyRequest } from 'fastify'
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserTenant,
  createSession,
  deleteSession,
  deleteAllSessions,
  createTokens,
  updateSessionTenant
} from './auth.service'
import { CreateUserInput, LoginInput, SelectTenantInput } from './auth.schema'
import { verifyPassword } from '@/utils/hash'
import {
  clearAccessToken,
  clearRefreshToken,
  REFRESH_COOKIE
} from '@/lib/authCookies'
import { setAccessToken, setRefreshToken } from '@/lib/authCookies'
import { getTenantDetails } from '../tenants/tenant.service'
import { sendVerificationOTP, verifyOTP } from './verification.service'
import { VerifyOtpInput } from './verification.schema'
import chalk from 'chalk'
import { signAccessFromUserAndSession } from '@/lib/authTokens'

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
  const { email, password } = request.body

  try {
    const user = await findUserByEmail(email)

    // Check email và password
    if (!user || !(await verifyPassword(password, user.password))) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid Email or Password!'
      })
    }

    // Tạo payload
    const payload = {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified
    }

    const { accessToken, refreshToken } = await createTokens(
      request.server,
      payload
    )

    // Set cookies
    setAccessToken(reply, accessToken)
    setRefreshToken(reply, refreshToken)
    //Bỏ session_id, giờ refresh_token là session_id luôn

    // Trả về user info
    const res = {
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
    }
    console.log(chalk.bgGreen('User login:'), res)

    return reply.send(res)
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
  const isVerified = request.user.isVerified

  if (isVerified) {
    return reply.code(200).send({
      error: 400,
      message: 'Email already verified.'
    })
  }

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
  const isVerified = request.user.isVerified

  if (isVerified) {
    return reply.code(200).send({
      error: 400,
      message: 'Email already verified.'
    })
  }
  const { otp } = request.body as VerifyOtpInput

  const ok = await verifyOTP(request.server, request.user.id, otp)

  if (!ok) {
    return reply
      .code(400)
      .send({ error: 'Invalid OTP', message: 'Invalid or expired OTP' })
  }

  // Tạo access token mới có isVerified = true
  const accessToken = await request.server.jwt.sign({
    ...request.user,
    isVerified: true
  })
  setAccessToken(reply, accessToken)

  return reply.code(200).send({ message: 'Email verified successfully' })
}

export async function selectTenantHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = request.user
  const { tenantId } = request.body as SelectTenantInput

  try {
    //Đặt tên là member cho đúng
    const member = await findUserTenant(user.id, tenantId)
    if (!member) {
      return reply
        .code(403)
        .send({ error: 'Unauthorized', message: 'Access denied' })
    }

    const refreshToken =
      (request.cookies as any)[REFRESH_COOKIE] ?? request.cookies.refresh_token
    if (!refreshToken) {
      return reply
        .code(401)
        .send({ error: 'Unauthorized', message: 'Missing refresh token' })
    }

    const updated = await updateSessionTenant(
      request.server,
      refreshToken,
      tenantId,
      member.role
    )
    if (!updated) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token'
      })
    }

    const { accessToken } = await signAccessFromUserAndSession(
      request.server,
      { id: user.id, email: user.email, isVerified: user.isVerified },
      { tenantId, role: member.role }
    )
    setAccessToken(reply, accessToken)

    return reply.send({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        currentTenant: {
          tenantId,
          name: member.tenant.name,
          role: member.role
        }
      }
    })
  } catch (e) {
    request.log.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Select tenant failed'
    })
  }
}

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
      ? await getTenantDetails(user.id, user.tenantId)
      : null

    // console.log('Current Tenant:', currentTenant)

    const response = {
      ...fullUser,
      currentTenant,
      tenants: fullUser.tenants.map((t) => ({
        id: t.tenant.id,
        name: t.tenant.name,
        role: t.role,
        createdAt: t.tenant.createdAt,
        updatedAt: t.tenant.updatedAt
      }))
    }

    // console.log('meHandler response:', JSON.stringify(response, null, 2))

    return reply.send(response)
  } catch (e) {
    console.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to get user data'
    })
  }
}

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const sessionId = request.cookies.session_id

    if (sessionId) {
      await deleteSession(request.server, sessionId)
    }

    clearAccessToken(reply)
    clearRefreshToken(reply)

    return reply.code(200).send({ message: 'Logout successful' })
  } catch (e) {
    console.error(e)
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to log out'
    })
  }
}

export async function logoutAllHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user.id

    if (userId) {
      await deleteAllSessions(request.server, userId)
    }
    clearAccessToken(reply)
    clearRefreshToken(reply)

    return reply.code(200).send({ message: 'Logout all sessions successful' })
  } catch (e) {
    return reply.code(500).send({
      error: 'Internal server error',
      message: 'Failed to logout'
    })
  }
}
