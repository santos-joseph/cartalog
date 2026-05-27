import { FastifyInstance } from 'fastify'
import { vehiclesService } from './vehicles.service'
import { createVehicleSchema, updateVehicleSchema, vehicleFiltersSchema } from './vehicles.schema'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'
import { AppError } from '../../shared/errors/app-error'
import { uploadsService } from '../uploads/uploads.service'

export async function vehiclesRoutes(app: FastifyInstance) {
  // ---- PUBLIC routes (catalog) - no auth needed ----

  // GET /vehicles/public/:companySlug — catálogo público
  app.get('/public/:companySlug', async (request) => {
    const { companySlug } = request.params as { companySlug: string }
    const company = await import('../../database/prisma').then((m) =>
      m.prisma.company.findUnique({ where: { slug: companySlug } }),
    )
    if (!company) throw new AppError('Company not found', 404)

    const filters = vehicleFiltersSchema.parse({
      ...(request.query as object),
      status: 'AVAILABLE',
    })
    return vehiclesService.list(company.id, filters)
  })

  app.get('/public/:companySlug/:slug', async (request) => {
    const { companySlug, slug } = request.params as { companySlug: string; slug: string }
    const company = await import('../../database/prisma').then((m) =>
      m.prisma.company.findUnique({ where: { slug: companySlug } }),
    )
    if (!company) throw new AppError('Company not found', 404)
    return vehiclesService.findBySlug(company.id, slug)
  })

  // ---- Reference data (public) ----
  app.get('/brands', async () => vehiclesService.getBrands())
  app.get('/models', async (request) => {
    const { brandId } = request.query as { brandId?: string }
    return vehiclesService.getModels(brandId)
  })
  app.get('/features', async () => vehiclesService.getFeatures())

  // ---- PRIVATE routes (admin panel) ----
  app.register(async (privateApp) => {
    privateApp.addHook('onRequest', authMiddleware)

    // GET /vehicles — listar veículos da empresa
    privateApp.get('/', async (request) => {
      const filters = vehicleFiltersSchema.parse(request.query)
      return vehiclesService.list(request.user.companyId, filters)
    })

    // GET /vehicles/:id
    privateApp.get('/:id', async (request) => {
      const { id } = request.params as { id: string }
      return vehiclesService.findById(request.user.companyId, id)
    })

    // POST /vehicles
    privateApp.post('/', async (request, reply) => {
      const body = createVehicleSchema.parse(request.body)
      const vehicle = await vehiclesService.create(request.user.companyId, body)
      return reply.status(201).send(vehicle)
    })

    // PUT /vehicles/:id
    privateApp.put('/:id', async (request, reply) => {
      const { id } = request.params as { id: string }
      const body = updateVehicleSchema.parse(request.body)
      const vehicle = await vehiclesService.update(request.user.companyId, id, body)
      return reply.send(vehicle)
    })

    // DELETE /vehicles/:id
    privateApp.delete('/:id', async (request, reply) => {
      const { id } = request.params as { id: string }
      await vehiclesService.delete(request.user.companyId, id)
      return reply.status(204).send()
    })

    // POST /vehicles/:id/images — upload de imagens
    privateApp.post('/:id/images', async (request, reply) => {
      const { id } = request.params as { id: string }
      const files = request.files()
      const urls: string[] = []

      for await (const file of files) {
        const url = await uploadsService.saveFile(file, 'vehicles')
        urls.push(url)
      }

      if (urls.length === 0) throw new AppError('No images provided')
      const images = await vehiclesService.addImages(request.user.companyId, id, urls)
      return reply.status(201).send(images)
    })

    // DELETE /vehicles/:id/images/:imageId
    privateApp.delete('/:id/images/:imageId', async (request, reply) => {
      const { id, imageId } = request.params as { id: string; imageId: string }
      await vehiclesService.deleteImage(request.user.companyId, id, imageId)
      return reply.status(204).send()
    })

    // PATCH /vehicles/:id/cover — definir imagem de capa
    privateApp.patch('/:id/cover', async (request, reply) => {
      const { id } = request.params as { id: string }
      const file = await request.file()
      if (!file) throw new AppError('No file provided')
      const url = await uploadsService.saveFile(file, 'vehicles')
      const vehicle = await vehiclesService.setCoverImage(request.user.companyId, id, url)
      return reply.send({ coverImageUrl: vehicle.coverImageUrl })
    })
  })
}
