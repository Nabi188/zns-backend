import { FastifyInstance } from 'fastify'
import { prisma } from '@/lib/prisma'
import os from 'os'
import chalk from 'chalk'

function colorByUsage(value: number) {
  if (value < 50) return chalk.bgGreen.bold(value.toFixed(1) + '%')
  if (value < 80) return chalk.bgYellow.bold(value.toFixed(1) + '%')
  return chalk.bgRed.bold(value.toFixed(1) + '%')
}

export async function healthcheckRoutes(server: FastifyInstance) {
  async function logStatus() {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100
    const loadAvg = os.loadavg()[0]
    const cpuPercent = Math.min((loadAvg / os.cpus().length) * 100, 100)

    let prisma_status = 'ERROR'
    try {
      const plan = await prisma.plan.findFirst({ select: { id: true } })
      prisma_status = plan ? 'OK' : 'ERROR'
    } catch {
      prisma_status = 'ERROR'
    }

    let redis_status = 'ERROR'
    try {
      const pong = await server.redis.ping()
      redis_status = pong === 'PONG' ? 'OK' : 'ERROR'
    } catch {
      redis_status = 'ERROR'
    }

    console.log(
      chalk.blue('System usage:'),
      'CPU:',
      colorByUsage(cpuPercent),
      'RAM:',
      colorByUsage(usedMemPercent),
      'Database:',
      prisma_status === 'OK' ? chalk.green.bold('OK') : chalk.red.bold('ERROR'),
      'Redis:',
      redis_status === 'OK' ? chalk.green.bold('OK') : chalk.red.bold('ERROR')
    )
  }

  logStatus()
  setInterval(logStatus, 300 * 1000)

  server.get('/', async (request, reply) => {
    const plan = await prisma.plan.findFirst({ select: { id: true } })
    const prisma_status = plan ? 'OK' : 'ERROR'

    let redis_status = 'ERROR'
    try {
      const pong = await request.server.redis.ping()
      redis_status = pong === 'PONG' ? 'OK' : 'ERROR'
    } catch {
      redis_status = 'ERROR'
    }

    return reply.code(200).send({
      redis: redis_status === 'OK' ? 'OK' : 'ERROR',
      db: prisma_status
    })
  })
}
