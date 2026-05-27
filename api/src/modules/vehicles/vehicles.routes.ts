import { FastifyInstance } from 'fastify'
import { vehiclesService } from './vehicles.service'
import { createVehicleSchema, updateVehicleSchema, vehicleFiltersSchema } from './vehicles.schema'
import { authMiddleware } from '../../shared/middlewares/auth.middleware'
import { AppError } from '../../shared/errors/app-error'
import { uploadsService } from '../uploads/uploads.service'

export async function vehiclesRoutes(app: FastifyInstance) {
  // ---- Reference data (public) ----
  app.get('/brands', async () => vehiclesService.getBrands())
  app.get('/models', async (request) => {
    const { brandId } = request.query as { brandId?: string }
    return vehiclesService.getModels(brandId)
  })
  app.get('/fuels', async () => vehiclesService.getFuels())
  app.get('/transmissions', async () => vehiclesService.getTransmissions())
  app.get('/features', async () => vehiclesService.getFeatures())

  // ---- PRIVATE routes (admin panel) ----
  app.register(async (privateApp) => {
    privateApp.addHook('onRequest', authMiddleware)

    // GET /vehicles
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

    // POST /vehicles/:id/images
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

    // PATCH /vehicles/:id/cover
    privateApp.patch('/:id/cover', async (request, reply) => {
      const { id } = request.params as { id: string }
      const { imageId } = request.body as { imageId: string }
      if (!imageId) throw new AppError('imageId is required')
      const image = await vehiclesService.setCoverImage(request.user.companyId, id, imageId)
      return reply.send(image)
    })
  })
}
