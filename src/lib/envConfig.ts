import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number(),
  BASE_URL: z.string(),
  JWT_SECRET: z.string(),
  REDIS_URL: z.string(),
  JWT_MAX_AGE: z.coerce.number(),
  FRONTEND_DOMAIN: z.string(),
  FRONTEND_URL: z.string(),
  SMTP_HOST: z.string(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  NODE_ENV: z.string()
})

const env = {
  PORT: process.env.PORT,
  BASE_URL: process.env.BASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  JWT_MAX_AGE: process.env.JWT_MAX_AGE,
  FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN,
  FRONTEND_URL: process.env.FRONTEND_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  NODE_ENV: process.env.NODE_ENV
}

const parsedEnv = envSchema.safeParse(env)

if (!parsedEnv.success) {
  const envError = parsedEnv.success === false ? parsedEnv.error.issues : []

  const errorMessages = [...envError]
    .map((i) => `${i.path.join('.')}:${i.message}`)
    .join(', ')

  throw new Error('ENV validation failed: ' + errorMessages)
}

export const envConfig = parsedEnv.data
