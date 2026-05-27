import path from 'path'
import fs from 'fs/promises'
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
import { env } from '../../config/env'
import { AppError } from '../../shared/errors/app-error'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

async function saveUploadedFile(file: AsyncIterableIterator<unknown> | null, subdir: string) {
  if (!file) throw new AppError('No file provided')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = file as any

  if (!ALLOWED_IMAGE_TYPES.includes(data.mimetype)) {
    throw new AppError('Only JPEG, PNG, WebP and GIF images are allowed', 400)
  }

  const ext = data.filename.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const dir = path.join(env.UPLOAD_DIR, subdir)

  await fs.mkdir(dir, { recursive: true })

  const buffer = await data.toBuffer()
  const filePath = path.join(dir, filename)
  await fs.writeFile(filePath, buffer)

  return `/uploads/${subdir}/${filename}`
}

export async function companiesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  // GET /companies/me — dados da empresa atual
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
    const url = await saveUploadedFile(file as unknown as AsyncIterableIterator<unknown>, 'logos')
    const settings = await companiesService.updateLogo(request.user.companyId, url)
    return reply.send({ logoUrl: settings.logoUrl })
  })

  app.post('/settings/favicon', async (request, reply) => {
    const file = await request.file()
    const url = await saveUploadedFile(file as unknown as AsyncIterableIterator<unknown>, 'favicons')
    const settings = await companiesService.updateFavicon(request.user.companyId, url)
    return reply.send({ faviconUrl: settings.faviconUrl })
  })

  // ---- BANNERS ----
  app.get('/banners', async (request) => {
    return companiesService.getBanners(request.user.companyId)
  })

  app.post('/banners', { onRequest: [requireRole('ADMIN', 'MANAGER')] }, async (request, reply) => {
    const parts = request.parts()
    let imageUrl: string | null = null
    let fields: Record<string, unknown> = {}

    for await (const part of parts) {
      if (part.type === 'file') {
        imageUrl = await saveUploadedFile(
          part as unknown as AsyncIterableIterator<unknown>,
          'banners',
        )
      } else {
        fields[part.fieldname] = (part as { value: unknown }).value
      }
    }

    if (!imageUrl) throw new AppError('Banner image is required')

    const body = createBannerSchema.parse(fields)
    const banner = await companiesService.createBanner(request.user.companyId, imageUrl, body)
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
