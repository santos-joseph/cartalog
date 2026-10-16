import { FastifyInstance } from 'fastify'
import { dashboardService } from './dashboard.service'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  app.get('/overview', async (request) => {
    return dashboardService.getOverview(request.user.companyId)
  })
}
