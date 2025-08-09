// lib/email/emailService.ts
import { FastifyInstance } from 'fastify'
import { envConfig } from '@/lib/envConfig'

export interface EmailTemplate {
  subject: string
  html?: string
  text: string
}

export interface SendEmailOptions {
  to: string
  template: EmailTemplate
  from?: string
}

export async function sendEmail(
  fastify: FastifyInstance,
  options: SendEmailOptions
): Promise<void> {
  const {
    to,
    template,
    from = `DZNS - Digii Việt Nam <${envConfig.SMTP_USER}>`
  } = options

  try {
    await fastify.nodemailer.sendMail({
      from,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    throw new Error('Email sending failed')
  }
}
