import { FastifyInstance } from 'fastify'
import { leadsService } from './leads.service'
import { createLeadSchema, updateLeadSchema, createInteractionSchema, leadsFiltersSchema, createLeadStatusSchema, updateLeadStatusSchema } from './leads.schema'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'
import { tenantMiddleware } from '../../shared/middlewares/tenant.middleware'

export async function leadsRoutes(app: FastifyInstance) {
  // POST /leads/public — captura pública de leads (sem auth, empresa pelo subdomínio)
  app.post('/public', { onRequest: [tenantMiddleware] }, async (request, reply) => {
    const body = createLeadSchema.parse(request.body)
    const lead = await leadsService.create(request.tenant.id, body)
    return reply.status(201).send({ message: 'Lead received', id: lead.id })
  })

  // ---- Private routes ----
  app.register(async (privateApp) => {
    privateApp.addHook('onRequest', authMiddleware)

    privateApp.get('/', async (request) => {
      const filters = leadsFiltersSchema.parse(request.query)
      return leadsService.list(request.user.companyId, filters)
    })

    privateApp.get('/stats', async (request) => {
      return leadsService.getStats(request.user.companyId)
    })

    privateApp.get('/statuses', async (request) => {
      return leadsService.getStatuses(request.user.companyId)
    })

    privateApp.post('/statuses', async (request, reply) => {
      const body = createLeadStatusSchema.parse(request.body)
      const status = await leadsService.createStatus(request.user.companyId, body)
      return reply.status(201).send(status)
    })

    privateApp.put('/statuses/:id', async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateLeadStatusSchema.parse(request.body)
      const status = await leadsService.updateStatus(request.user.companyId, id, body)
      return reply.send(status)
    })

    privateApp.delete('/statuses/:id', async (request, reply) => {
      const { id } = request.params as { id: string }
      await leadsService.deleteStatus(request.user.companyId, id)
      return reply.status(204).send()
    })

    privateApp.get('/:id', async (request) => {
      const { id } = request.params as { id: string }
      return leadsService.findById(request.user.companyId, id)
    })

    privateApp.post('/', async (request, reply) => {
      const body = createLeadSchema.parse(request.body)
      const lead = await leadsService.create(request.user.companyId, body)
      return reply.status(201).send(lead)
    })

    privateApp.patch('/:id', async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateLeadSchema.parse(request.body)
      const lead = await leadsService.update(request.user.companyId, id, body)
      return reply.send(lead)
    })

    privateApp.post('/:id/interactions', async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = createInteractionSchema.parse(request.body)
      const interaction = await leadsService.addInteraction(
        request.user.companyId,
        id,
        request.user.sub,
        body,
      )
      return reply.status(201).send(interaction)
    })
  })
}
