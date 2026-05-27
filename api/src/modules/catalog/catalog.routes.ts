import { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma'
import { vehiclesService } from '../vehicles/vehicles.service'
import { vehicleFiltersSchema } from '../vehicles/vehicles.schema'
import { AppError } from '../../shared/errors/app-error'

async function getCompanyBySlug(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      settings: true,
      banners: { where: { active: true }, orderBy: { order: 'asc' } },
      pages: {
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true, order: true },
        orderBy: { order: 'asc' },
      },
    },
  })
  if (!company || !company.active) throw new AppError('Catalog not found', 404)
  return company
}

export async function catalogRoutes(app: FastifyInstance) {
  // GET /catalog/:slug — homepage do catálogo (empresa + veículos em destaque)
  app.get('/:slug', async (request) => {
    const { slug } = request.params as { slug: string }
    const company = await getCompanyBySlug(slug)

    const featured = await vehiclesService.list(company.id, {
      page: 1,
      perPage: 6,
      featured: true,
      status: 'AVAILABLE',
      orderBy: 'createdAt',
      order: 'desc',
    })

    return {
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        settings: company.settings,
        banners: company.banners,
        pages: company.pages,
      },
      featuredVehicles: featured.data,
    }
  })

  // GET /catalog/:slug/vehicles — listagem de veículos do catálogo
  app.get('/:slug/vehicles', async (request) => {
    const { slug } = request.params as { slug: string }
    const company = await getCompanyBySlug(slug)

    const filters = vehicleFiltersSchema.parse({
      ...(request.query as object),
      status: 'AVAILABLE',
    })

    return vehiclesService.list(company.id, filters)
  })

  // GET /catalog/:slug/vehicles/:vehicleSlug — detalhe do veículo
  app.get('/:slug/vehicles/:vehicleSlug', async (request) => {
    const { slug, vehicleSlug } = request.params as { slug: string; vehicleSlug: string }
    const company = await getCompanyBySlug(slug)
    return vehiclesService.findBySlug(company.id, vehicleSlug)
  })

  // GET /catalog/:slug/pages/:pageSlug — página customizada
  app.get('/:slug/pages/:pageSlug', async (request) => {
    const { slug, pageSlug } = request.params as { slug: string; pageSlug: string }
    const company = await getCompanyBySlug(slug)

    const page = await prisma.page.findUnique({
      where: { companyId_slug: { companyId: company.id, slug: pageSlug }, status: 'PUBLISHED' },
    })
    if (!page) throw new AppError('Page not found', 404)
    return page
  })
}
