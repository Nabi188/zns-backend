import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number(),
  BASE_URL: z.string(),
  JWT_SECRET: z.string(),
  REDIS_URL: z.string()
})

const env = {
  PORT: process.env.PORT,
  BASE_URL: process.env.BASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL
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
