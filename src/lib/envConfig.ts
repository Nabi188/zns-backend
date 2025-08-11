import 'dotenv/config'
import { z } from 'zod'
import chalk from 'chalk'

const envSchema = z.object({
  PORT: z.coerce.number(),
  BASE_URL: z.string(),
  JWT_SECRET: z.string(),
  REDIS_URL: z.string(),
  ACCESS_TOKEN_MAX_AGE: z.coerce.number(),
  REFRESH_TOKEN_MAX_AGE: z.coerce.number(),
  SESSION_MAX_AGE: z.coerce.number(),
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
  ACCESS_TOKEN_MAX_AGE: process.env.ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE: process.env.REFRESH_TOKEN_MAX_AGE,
  SESSION_MAX_AGE: process.env.SESSION_MAX_AGE,
  FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN,
  FRONTEND_URL: process.env.FRONTEND_URL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  NODE_ENV: process.env.NODE_ENV
}

const parsedEnv = envSchema.safeParse(env)

if (!parsedEnv.success) {
  const envError = parsedEnv.error.issues

  const errorMessages = envError
    .map(
      (i) =>
        `${chalk.yellow.bold(i.path.join('.'))}: ${chalk.redBright(i.message)}`
    )
    .join('\n ')

  throw new Error(chalk.bgRed.bold('ENV validation failed:\n') + errorMessages)
}

export const envConfig = parsedEnv.data
