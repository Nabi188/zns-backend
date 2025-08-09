// modules/auth/verification.service.ts (Updated)
import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email/emailService'
import { verificationTemplate } from '@/lib/email/templates'

export async function sendVerificationOTP(
  fastify: FastifyInstance,
  userId: string,
  email: string
) {
  const lastKey = `verify:sent:${userId}`
  const setLast = await fastify.redis.set(lastKey, '1', 'EX', 60, 'NX')

  if (!setLast) {
    return { error: '409', message: 'Resend OTP after 60 second!' }
  }

  const otp = crypto.randomInt(100000, 1000000).toString()

  await fastify.redis.set(`verify:${userId}`, otp, 'EX', 900)

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true }
    })

    const template = verificationTemplate(otp, user?.fullName)

    await sendEmail(fastify, {
      to: email,
      template
    })

    return { message: 'OTP sent successfully' }
  } catch (error) {
    // Clean up Redis if email sending fails
    await fastify.redis.del(`verify:${userId}`)
    await fastify.redis.del(lastKey)

    console.error('Failed to send verification OTP:', error)
    throw new Error('Failed to send verification email')
  }
}

export async function verifyOTP(
  fastify: FastifyInstance,
  userId: string,
  otp: string
): Promise<boolean> {
  const stored = await fastify.redis.get(`verify:${userId}`)

  if (!stored || stored !== otp) {
    return false
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    })

    // Clean up Redis keys
    await fastify.redis.del(`verify:${userId}`)
    await fastify.redis.del(`verify:sent:${userId}`)

    return true
  } catch (error) {
    console.error('Failed to verify OTP:', error)
    throw new Error('Verification process failed')
  }
}
