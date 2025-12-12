import { RedisOptions } from 'bullmq'
import { envConfig } from '@/lib/envConfig'

export const redisOpts: RedisOptions = {
  url: envConfig.REDIS_URL
}
