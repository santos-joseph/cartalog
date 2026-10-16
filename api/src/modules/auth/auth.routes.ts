import { FastifyInstance } from 'fastify'
import { authService } from './auth.service'
import { registerSchema, loginSchema, refreshSchema } from './auth.schema'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'
import { extractSlugFromHost } from '../../shared/middlewares/tenant.middleware'

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    const result = await authService.register(body)
    return reply.status(201).send(result)
  })

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    const host = request.headers.host ?? ''
    const slugFromHost = extractSlugFromHost(host)
    const result = await authService.login(body, slugFromHost)
    return reply.send(result)
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
