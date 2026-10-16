import { FastifyInstance } from 'fastify'
import { usersService } from './users.service'
import { createUserSchema, updateUserSchema, changePasswordSchema } from './users.schema'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'

export async function usersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  // GET /users — listar equipe da empresa
  app.get('/', async (request) => {
    return usersService.list(request.user.companyId)
  })

  // GET /users/:id
  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return usersService.findById(request.user.companyId, id)
  })

  // POST /users — criar membro da equipe (só ADMIN/MANAGER)
  app.post('/', { onRequest: [requireRole('ADMIN', 'MANAGER')] }, async (request, reply) => {
    const body = createUserSchema.parse(request.body)
    const user = await usersService.create(request.user.companyId, body)
    return reply.status(201).send(user)
  })

  // PUT /users/:id — atualizar dados/role (só ADMIN/MANAGER)
  app.put('/:id', { onRequest: [requireRole('ADMIN', 'MANAGER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateUserSchema.parse(request.body)
    const user = await usersService.update(
      request.user.companyId,
      id,
      request.user.sub,
      request.user.role,
      body,
    )
    return reply.send(user)
  })

  // PATCH /users/me/password — o próprio usuário muda sua senha
  app.patch('/me/password', async (request, reply) => {
    const body = changePasswordSchema.parse(request.body)
    const result = await usersService.changePassword(request.user.companyId, request.user.sub, body)
    return reply.send(result)
  })

  // DELETE /users/:id — só ADMIN pode remover
  app.delete('/:id', { onRequest: [requireRole('ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await usersService.delete(request.user.companyId, id, request.user.sub)
    return reply.status(204).send()
  })
}
