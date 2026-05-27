import { FastifyInstance } from 'fastify'
import { leadsService } from './leads.service'
import { createLeadSchema, updateLeadSchema, createInteractionSchema, leadsFiltersSchema } from './leads.schema'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function leadsRoutes(app: FastifyInstance) {
  // POST /leads — captura pública de leads (sem auth)
  app.post('/public', async (request, reply) => {
    const body = createLeadSchema.parse(request.body)
    const { companyId } = request.query as { companyId: string }
    const lead = await leadsService.create(companyId, body)
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
      const interaction = await leadsService.addInteraction(request.user.companyId, id, request.user.sub, body)
      return reply.status(201).send(interaction)
    })
  })
}
