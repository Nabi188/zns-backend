//src/queues/zns-send.queue.ts
import { Queue } from 'bullmq'
import { redisOpts } from './redis'
import type { ZnsSendJob } from './queue.schema'

export const znsSendQueue = new Queue<ZnsSendJob>('zns-send', {
  connection: redisOpts,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 200
  }
})
