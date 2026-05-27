import { FastifyInstance } from 'fastify'
import { prisma } from '../../database/prisma'
import { vehiclesService } from '../vehicles/vehicles.service'
import { vehicleFiltersSchema } from '../vehicles/vehicles.schema'
import { AppError } from '../../shared/errors/app-error'

async function getCompanyBySlug(slug: string) {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      siteSettings: true,
      seoSettings: true,
      banners: { where: { isActive: true }, orderBy: { position: 'asc' } },
      pages: {
        where: { isPublished: true },
        select: { id: true, title: true, slug: true },
      },
    },
  })
  if (!company) throw new AppError('Catalog not found', 404)
  return company
}

export async function catalogRoutes(app: FastifyInstance) {
  // GET /catalog/:slug — homepage do catálogo
  app.get('/:slug', async (request) => {
    const { slug } = request.params as { slug: string }
    const company = await getCompanyBySlug(slug)

    const featured = await vehiclesService.list(company.id, {
      page: 1,
      perPage: 6,
      status: 'available',
      orderBy: 'createdAt',
      order: 'desc',
    })

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
        siteSettings: company.siteSettings,
        seoSettings: company.seoSettings,
        banners: company.banners,
        pages: company.pages,
      },
      featuredVehicles: featured.data,
    }
  })

  // GET /catalog/:slug/vehicles
  app.get('/:slug/vehicles', async (request) => {
    const { slug } = request.params as { slug: string }
    const company = await getCompanyBySlug(slug)

    const filters = vehicleFiltersSchema.parse({
      ...(request.query as object),
      status: 'available',
    })

    return vehiclesService.list(company.id, filters)
  })

  // GET /catalog/:slug/vehicles/:vehicleSlug
  app.get('/:slug/vehicles/:vehicleSlug', async (request) => {
    const { slug, vehicleSlug } = request.params as { slug: string; vehicleSlug: string }
    const company = await getCompanyBySlug(slug)
    return vehiclesService.findBySlug(company.id, vehicleSlug)
  })

  // GET /catalog/:slug/pages/:pageSlug
  app.get('/:slug/pages/:pageSlug', async (request) => {
    const { slug, pageSlug } = request.params as { slug: string; pageSlug: string }
    const company = await getCompanyBySlug(slug)

    const page = await prisma.page.findUnique({
      where: {
        companyId_slug: { companyId: company.id, slug: pageSlug },
        isPublished: true,
      },
    })
    if (!page) throw new AppError('Page not found', 404)
    return page
  })
}
