import { FastifyInstance } from 'fastify'
import { authService } from './auth.service'
import { loginSchema, refreshSchema } from './auth.schema'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'
import { prisma } from '../../database/prisma'
import { platformLogin } from '../platform/platform.auth'
import { UnauthorizedError } from '../../shared/errors/app-error'

const desktopLoginAttempts = new Map<string, { count: number; until: number }>()

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const result = await authService.login(body)
    return reply.send(result)
  })

  app.post('/desktop-login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const key = `${request.ip}:${body.email}`
    const attempt = desktopLoginAttempts.get(key)
    if (attempt && attempt.until > Date.now() && attempt.count >= 5) throw new UnauthorizedError('Aguarde 15 minutos antes de tentar novamente')
    try {
      const platformUser = await prisma.platformUser.findUnique({ where: { email: body.email }, select: { id: true } })
      if (platformUser) {
        const result = await platformLogin(body.email, body.password)
        desktopLoginAttempts.delete(key)
        return reply.send({ scope: 'platform', ...result })
      }
      const result = await authService.login(body)
      if (result.user.role !== 'OWNER') throw new UnauthorizedError('O desktop é exclusivo para donos de loja e administradores do Cartalog')
      desktopLoginAttempts.delete(key)
      return reply.send({ scope: 'company', ...result })
    } catch (error) {
      if (error instanceof UnauthorizedError) desktopLoginAttempts.set(key, { count: attempt && attempt.until > Date.now() ? attempt.count + 1 : 1, until: Date.now() + 15 * 60_000 })
      if (desktopLoginAttempts.size > 5000) for (const [attemptKey, value] of desktopLoginAttempts) if (value.until <= Date.now()) desktopLoginAttempts.delete(attemptKey)
      throw error
    }
  })

  app.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body)
    const result = await authService.refresh(body)
    return reply.send(result)
  })

  app.get('/me', { onRequest: [authMiddleware] }, async (request, reply) => {
    const result = await authService.me(request.user.sub)
    return reply.send(result)
  })
}
