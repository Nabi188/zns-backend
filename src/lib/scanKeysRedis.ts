import { FastifyInstance } from 'fastify'

export async function scanKeysRedis(
  redis: FastifyInstance['redis'],
  pattern: string,
  count = 100
): Promise<string[]> {
  const keys: string[] = []
  let cursor = '0'
  do {
    const [next, batch] = await redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      count
    )
    cursor = next
    if (batch && batch.length) keys.push(...batch)
  } while (cursor !== '0')
  return keys
}
