import { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma'
import { vehiclesService } from '../vehicles/vehicles.service'
import { vehicleFiltersSchema } from '../vehicles/vehicles.schema'
import { tenantMiddleware } from '../../shared/middlewares/tenant.middleware'
import { AppError } from '../../shared/errors/app-error'

export async function catalogRoutes(app: FastifyInstance) {
  app.addHook('onRequest', tenantMiddleware)

  app.get('/status', async (request) => ({
    name: request.tenant.name,
    logoUrl: request.tenant.logoUrl,
    maintenanceEnabled: request.tenant.siteSettings?.maintenanceEnabled ?? false,
    maintenanceMessage: request.tenant.siteSettings?.maintenanceMessage ?? null,
  }))

  app.addHook('preHandler', async (request, reply) => {
    if (request.url.split('?')[0] === '/api/v1/catalog/status') return
    if (request.tenant.siteSettings?.maintenanceEnabled) {
      return reply.status(503).header('Retry-After', '3600').header('X-Robots-Tag', 'noindex').send({ code: 'SITE_MAINTENANCE', message: request.tenant.siteSettings.maintenanceMessage || 'Este site está temporariamente em manutenção.' })
    }
  })

  // GET /catalog — homepage do catálogo (empresa identificada pelo subdomínio)
  app.get('/', async (request) => {
    const company = request.tenant

    const [featured, banners, pages] = await Promise.all([
      vehiclesService.list(company.id, {
        page: 1,
        perPage: 6,
        status: 'available',
        orderBy: 'createdAt',
        order: 'desc',
      }),
      prisma.banner.findMany({
        where: { companyId: company.id, isActive: true },
        orderBy: { position: 'asc' },
      }),
      prisma.page.findMany({
        where: { companyId: company.id, isPublished: true },
        select: { id: true, title: true, slug: true },
        orderBy: { title: 'asc' },
      }),
    ])

    return {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor,
        whatsapp: company.whatsapp,
        phone: company.phone,
        email: company.email,
        companyLocations: company.companyLocations.map(({ address, city, state }) => ({ address, city, state })),
        siteSettings: company.siteSettings,
        seoSettings: company.seoSettings,
        banners,
        pages,
      },
      featuredVehicles: featured.data,
    }
  })

  // GET /catalog/vehicles
  app.get('/vehicles', async (request) => {
    const filters = vehicleFiltersSchema.parse({
      ...(request.query as object),
      status: 'available',
    })
    return vehiclesService.list(request.tenant.id, filters)
  })

  // GET /catalog/vehicles/:vehicleSlug
  app.get('/vehicles/:vehicleSlug', async (request) => {
    const { vehicleSlug } = request.params as { vehicleSlug: string }
    const vehicle = await vehiclesService.findBySlug(request.tenant.id, vehicleSlug)
    if (vehicle.status !== 'available') throw new AppError('Vehicle not found', 404)
    return vehicle
  })

  // GET /catalog/pages/:pageSlug
  app.get('/pages/:pageSlug', async (request) => {
    const { pageSlug } = request.params as { pageSlug: string }

    const page = await prisma.page.findUnique({
      where: {
        companyId_slug: { companyId: request.tenant.id, slug: pageSlug },
        isPublished: true,
      },
    })
    if (!page) throw new AppError('Page not found', 404)
    return page
  })
}
