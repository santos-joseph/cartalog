import { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma'
import { env } from '../../config/env'

const START_TIME = Date.now()

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${d}d ${h}h ${m}m ${s}s`
}

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return {
      name: 'Cartalog API',
      version: '1.0.0',
      status: 'online',
      environment: env.NODE_ENV,
      docs: `${env.API_URL}/docs`,
    }
  })

  app.get('/health', async (_request, reply) => {
    const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000)

    let dbStatus: 'ok' | 'error' = 'ok'
    let dbLatencyMs = 0

    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      dbLatencyMs = Date.now() - start
    } catch {
      dbStatus = 'error'
    }

    const healthy = dbStatus === 'ok'

    return reply.status(healthy ? 200 : 503).send({
      status: healthy ? 'healthy' : 'degraded',
      uptime: {
        seconds: uptimeSeconds,
        human: formatUptime(uptimeSeconds),
      },
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
      },
      timestamp: new Date().toISOString(),
    })
  })
}
