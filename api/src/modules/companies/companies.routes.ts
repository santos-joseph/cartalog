import { FastifyInstance } from 'fastify'
import { companiesService } from './companies.service'
import {
  updateSettingsSchema,
  createBannerSchema,
  updateBannerSchema,
  createPageSchema,
  updatePageSchema,
} from './companies.schema'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import { AppError } from '../../shared/errors/app-error'
import { uploadsService } from '../uploads/uploads.service'

export async function companiesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  // GET /companies/me
  app.get('/me', async (request) => {
    return companiesService.getCompany(request.user.companyId)
  })

  // ---- SETTINGS ----
  app.get('/settings', async (request) => {
    return companiesService.getSettings(request.user.companyId)
  })

  app.put('/settings', async (request, reply) => {
    const body = updateSettingsSchema.parse(request.body)
    const settings = await companiesService.updateSettings(request.user.companyId, body)
    return reply.send(settings)
  })

  app.post('/settings/logo', async (request, reply) => {
    const file = await request.file()
    if (!file) throw new AppError('Logo file is required')
    const url = await uploadsService.saveFile(file, 'logos')
    const company = await companiesService.updateLogo(request.user.companyId, url)
    return reply.send({ logoUrl: company.logoUrl })
  })

  // ---- BANNERS ----
  app.get('/banners', async (request) => {
    return companiesService.getBanners(request.user.companyId)
  })

  app.post('/banners', { onRequest: [requireRole('ADMIN', 'MANAGER')] }, async (request, reply) => {
    const body = createBannerSchema.parse(request.body)
    const banner = await companiesService.createBanner(request.user.companyId, body)
    return reply.status(201).send(banner)
  })

  app.put('/banners/:id', { onRequest: [requireRole('ADMIN', 'MANAGER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateBannerSchema.parse(request.body)
    const banner = await companiesService.updateBanner(request.user.companyId, id, body)
    return reply.send(banner)
  })

  app.delete('/banners/:id', { onRequest: [requireRole('ADMIN', 'MANAGER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await companiesService.deleteBanner(request.user.companyId, id)
    return reply.status(204).send()
  })

  // ---- PAGES ----
  app.get('/pages', async (request) => {
    return companiesService.getPages(request.user.companyId)
  })

  app.post('/pages', { onRequest: [requireRole('ADMIN', 'MANAGER')] }, async (request, reply) => {
    const body = createPageSchema.parse(request.body)
    const page = await companiesService.createPage(request.user.companyId, body)
    return reply.status(201).send(page)
  })

  app.put('/pages/:id', { onRequest: [requireRole('ADMIN', 'MANAGER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updatePageSchema.parse(request.body)
    const page = await companiesService.updatePage(request.user.companyId, id, body)
    return reply.send(page)
  })

  app.delete('/pages/:id', { onRequest: [requireRole('ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await companiesService.deletePage(request.user.companyId, id)
    return reply.status(204).send()
  })
}
