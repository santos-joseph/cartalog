import { prisma } from '../../database/prisma'
import { NotFoundError, ConflictError } from '../../shared/errors/app-error'
import type {
  UpdateSettingsInput,
  CreateBannerInput,
  UpdateBannerInput,
  CreatePageInput,
  UpdatePageInput,
} from './companies.schema'

export class CompaniesService {
  async getCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { siteSettings: true, seoSettings: true, companyLocations: { take: 1 } },
    })
    if (!company) throw new NotFoundError('Company')
    return company
  }

  // ---- SETTINGS ----

  async getSettings(companyId: string) {
    const [company, siteSettings, seoSettings, location] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.siteSettings.findUnique({ where: { companyId } }),
      prisma.seoSettings.findUnique({ where: { companyId } }),
      prisma.companyLocation.findFirst({ where: { companyId } }),
    ])
    if (!company) throw new NotFoundError('Company')

    return {
      primaryColor: company.primaryColor ?? '#2563EB',
      secondaryColor: company.secondaryColor ?? '#1E40AF',
      whatsapp: company.whatsapp ?? null,
      phone: company.phone ?? null,
      email: company.email ?? null,
      showPrices: siteSettings?.showPrices ?? true,
      showWhatsappButton: siteSettings?.showWhatsappButton ?? true,
      siteTitle: seoSettings?.metaTitle ?? null,
      siteDescription: seoSettings?.metaDescription ?? null,
      siteKeywords: seoSettings?.metaKeywords ?? null,
      address: location?.address ?? null,
      city: location?.city ?? null,
      state: location?.state ?? null,
      zipCode: location?.zipCode ?? null,
    }
  }

  async updateSettings(companyId: string, input: UpdateSettingsInput) {
    const {
      primaryColor, secondaryColor, whatsapp, phone, email,
      showPrices, showWhatsappButton,
      siteTitle, siteDescription, siteKeywords,
      address, city, state, zipCode,
    } = input

    await Promise.all([
      prisma.company.update({
        where: { id: companyId },
        data: {
          ...(primaryColor !== undefined && { primaryColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...(whatsapp !== undefined && { whatsapp }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
        },
      }),

      prisma.siteSettings.upsert({
        where: { companyId },
        update: {
          ...(showPrices !== undefined && { showPrices }),
          ...(showWhatsappButton !== undefined && { showWhatsappButton }),
        },
        create: { companyId, showPrices: showPrices ?? true, showWhatsappButton: showWhatsappButton ?? true },
      }),

      prisma.seoSettings.upsert({
        where: { companyId },
        update: {
          ...(siteTitle !== undefined && { metaTitle: siteTitle }),
          ...(siteDescription !== undefined && { metaDescription: siteDescription }),
          ...(siteKeywords !== undefined && { metaKeywords: siteKeywords }),
        },
        create: {
          companyId,
          metaTitle: siteTitle ?? null,
          metaDescription: siteDescription ?? null,
          metaKeywords: siteKeywords ?? null,
        },
      }),

      (address || city || state || zipCode) ? prisma.companyLocation.upsert({
        where: { id: await this.getLocationId(companyId) },
        update: {
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(zipCode !== undefined && { zipCode }),
        },
        create: { companyId, address, city, state, zipCode },
      }).catch(() => null) : Promise.resolve(),
    ])

    return this.getSettings(companyId)
  }

  async updateLogo(companyId: string, logoUrl: string) {
    return prisma.company.update({ where: { id: companyId }, data: { logoUrl } })
  }

  // ---- BANNERS ----

  async getBanners(companyId: string) {
    return prisma.banner.findMany({
      where: { companyId },
      orderBy: { position: 'asc' },
    })
  }

  async createBanner(companyId: string, input: CreateBannerInput) {
    const count = await prisma.banner.count({ where: { companyId } })
    return prisma.banner.create({
      data: { companyId, ...input, position: input.position ?? count },
    })
  }

  async updateBanner(companyId: string, bannerId: string, input: UpdateBannerInput) {
    await this.findBannerOrThrow(companyId, bannerId)
    return prisma.banner.update({ where: { id: bannerId }, data: input })
  }

  async deleteBanner(companyId: string, bannerId: string) {
    await this.findBannerOrThrow(companyId, bannerId)
    await prisma.banner.delete({ where: { id: bannerId } })
  }

  private async findBannerOrThrow(companyId: string, bannerId: string) {
    const banner = await prisma.banner.findFirst({ where: { id: bannerId, companyId } })
    if (!banner) throw new NotFoundError('Banner')
    return banner
  }

  // ---- PAGES ----

  async getPages(companyId: string) {
    return prisma.page.findMany({
      where: { companyId },
      select: { id: true, title: true, slug: true, isPublished: true },
    })
  }

  async getPage(companyId: string, slug: string) {
    const page = await prisma.page.findUnique({ where: { companyId_slug: { companyId, slug } } })
    if (!page) throw new NotFoundError('Page')
    return page
  }

  async createPage(companyId: string, input: CreatePageInput) {
    const existing = await prisma.page.findUnique({
      where: { companyId_slug: { companyId, slug: input.slug } },
    })
    if (existing) throw new ConflictError(`Page with slug "${input.slug}"`)
    return prisma.page.create({ data: { companyId, ...input } })
  }

  async updatePage(companyId: string, pageId: string, input: UpdatePageInput) {
    await this.findPageOrThrow(companyId, pageId)

    if (input.slug) {
      const conflict = await prisma.page.findFirst({
        where: { companyId, slug: input.slug, NOT: { id: pageId } },
      })
      if (conflict) throw new ConflictError(`Page with slug "${input.slug}"`)
    }

    return prisma.page.update({ where: { id: pageId }, data: input })
  }

  async deletePage(companyId: string, pageId: string) {
    await this.findPageOrThrow(companyId, pageId)
    await prisma.page.delete({ where: { id: pageId } })
  }

  private async findPageOrThrow(companyId: string, pageId: string) {
    const page = await prisma.page.findFirst({ where: { id: pageId, companyId } })
    if (!page) throw new NotFoundError('Page')
    return page
  }

  private async getLocationId(companyId: string): Promise<string> {
    const loc = await prisma.companyLocation.findFirst({ where: { companyId } })
    return loc?.id ?? ''
  }
}

export const companiesService = new CompaniesService()
