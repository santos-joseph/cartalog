import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../database/prisma'
import { sendDemoRequestEmail } from './demo.service'

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(255),
  phone: z.string().trim().min(8).max(30),
  companyName: z.string().trim().min(2).max(100),
  message: z.string().trim().max(2000).optional(),
  website: z.string().max(200).optional(),
})

const attempts = new Map<string, number[]>()

export async function demoRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const input = schema.parse(request.body)
    if (input.website) return reply.status(201).send({ received: true })

    const now = Date.now()
    const recent = (attempts.get(request.ip) ?? []).filter((time) => now - time < 10 * 60_000)
    if (recent.length >= 5) return reply.status(429).send({ message: 'Muitas solicitações. Tente novamente em alguns minutos.' })
    recent.push(now)
    attempts.set(request.ip, recent)
    if (attempts.size > 5000) {
      for (const [ip, times] of attempts) if (times.every((time) => now - time >= 10 * 60_000)) attempts.delete(ip)
    }

    const demoRequest = await prisma.demoRequest.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        companyName: input.companyName,
        message: input.message || null,
      },
    })

    try {
      await sendDemoRequestEmail(demoRequest)
      await prisma.demoRequest.update({ where: { id: demoRequest.id }, data: { emailStatus: 'sent', emailedAt: new Date() } })
    } catch (error) {
      await prisma.demoRequest.update({ where: { id: demoRequest.id }, data: { emailStatus: 'failed' } })
      app.log.error({ err: error, demoRequestId: demoRequest.id }, 'Could not email demo request; stored for retry')
    }

    return reply.status(201).send({ received: true })
  })
}
