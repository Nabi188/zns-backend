import fp from 'fastify-plugin'
import nodemailer from 'nodemailer'
import { envConfig } from '@/lib/envConfig'

export default fp(async (fastify) => {
  const transporter = nodemailer.createTransport({
    host: envConfig.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: envConfig.SMTP_USER,
      pass: envConfig.SMTP_PASS
    }
  })

  fastify.decorate('nodemailer', transporter)
})
