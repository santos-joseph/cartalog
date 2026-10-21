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
import { categoriesRoutes } from './categories.routes'
import { prisma } from '../../database/prisma'
import { z } from 'zod'

export async function companiesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  // Sub-routers
  app.register(categoriesRoutes, { prefix: '/categories' })

  // GET /companies/me
  app.get('/me', async (request) => {
    return companiesService.getCompany(request.user.companyId)
  })

  // ---- SETTINGS ----
  app.get('/settings', async (request) => {
    return companiesService.getSettings(request.user.companyId)
  })

  app.get('/settings/maintenance', { onRequest: [requireRole('OWNER')] }, async (request) => {
    const settings = await prisma.siteSettings.findUnique({ where: { companyId: request.user.companyId }, select: { maintenanceEnabled: true, maintenanceMessage: true, maintenanceUpdatedAt: true } })
    return settings ?? { maintenanceEnabled: false, maintenanceMessage: null, maintenanceUpdatedAt: null }
  })

  app.patch('/settings/maintenance', { onRequest: [requireRole('OWNER')] }, async (request) => {
    const input = z.object({ enabled: z.boolean(), message: z.string().trim().max(500).nullish() }).parse(request.body)
    return prisma.$transaction(async (tx) => {
      const settings = await tx.siteSettings.upsert({
        where: { companyId: request.user.companyId },
        create: { companyId: request.user.companyId, maintenanceEnabled: input.enabled, maintenanceMessage: input.message || null, maintenanceUpdatedAt: new Date() },
        update: { maintenanceEnabled: input.enabled, maintenanceMessage: input.message || null, maintenanceUpdatedAt: new Date() },
        select: { maintenanceEnabled: true, maintenanceMessage: true, maintenanceUpdatedAt: true },
      })
      await tx.siteMaintenanceEvent.create({ data: { companyId: request.user.companyId, userId: request.user.sub, enabled: input.enabled, message: input.message || null } })
      return settings
    })
  })

  app.put('/settings', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const body = updateSettingsSchema.parse(request.body)
    const settings = await companiesService.updateSettings(request.user.companyId, body)
    return reply.send(settings)
  })

  app.post('/settings/logo', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
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

  app.post('/banners', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const body = createBannerSchema.parse(request.body)
    const banner = await companiesService.createBanner(request.user.companyId, body)
    return reply.status(201).send(banner)
  })

  app.put('/banners/:id', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateBannerSchema.parse(request.body)
    const banner = await companiesService.updateBanner(request.user.companyId, id, body)
    return reply.send(banner)
  })

  app.delete('/banners/:id', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await companiesService.deleteBanner(request.user.companyId, id)
    return reply.status(204).send()
  })

  // POST /companies/banners/:id/image — upload de imagem do banner via multipart
  app.post('/banners/:id/image', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const file = await request.file()
    if (!file) throw new AppError('Image file is required')
    const url = await uploadsService.saveFile(file, 'banners')
    const banner = await companiesService.updateBanner(request.user.companyId, id, { imageUrl: url })
    return reply.send(banner)
  })

  // ---- PAGES ----
  app.get('/pages', async (request) => {
    return companiesService.getPages(request.user.companyId)
  })

  app.post('/pages/images', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const file = await request.file()
    if (!file) throw new AppError('Image file is required')
    const imageUrl = await uploadsService.saveFile(file, 'pages')
    return reply.status(201).send({ imageUrl })
  })

  app.get('/pages/:id', async (request) => {
    const { id } = request.params as { id: string }
    return companiesService.getPageById(request.user.companyId, id)
  })

  app.post('/pages', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const body = createPageSchema.parse(request.body)
    const page = await companiesService.createPage(request.user.companyId, body)
    return reply.status(201).send(page)
  })

  app.put('/pages/:id', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updatePageSchema.parse(request.body)
    const page = await companiesService.updatePage(request.user.companyId, id, body)
    return reply.send(page)
  })

  app.delete('/pages/:id', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await companiesService.deletePage(request.user.companyId, id)
    return reply.status(204).send()
  })
}
