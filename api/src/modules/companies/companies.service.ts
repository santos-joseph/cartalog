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
      include: { settings: true },
    })
    if (!company) throw new NotFoundError('Company')
    return company
  }

  // ---- SETTINGS ----

  async getSettings(companyId: string) {
    const settings = await prisma.companySettings.findUnique({ where: { companyId } })
    if (!settings) throw new NotFoundError('Company settings')
    return settings
  }

  async updateSettings(companyId: string, input: UpdateSettingsInput) {
    return prisma.companySettings.update({
      where: { companyId },
      data: input,
    })
  }

  async updateLogo(companyId: string, logoUrl: string) {
    return prisma.companySettings.update({
      where: { companyId },
      data: { logoUrl },
    })
  }

  async updateFavicon(companyId: string, faviconUrl: string) {
    return prisma.companySettings.update({
      where: { companyId },
      data: { faviconUrl },
    })
  }

  // ---- BANNERS ----

  async getBanners(companyId: string) {
    return prisma.banner.findMany({
      where: { companyId },
      orderBy: { order: 'asc' },
    })
  }

  async createBanner(companyId: string, imageUrl: string, input: CreateBannerInput) {
    return prisma.banner.create({
      data: { companyId, imageUrl, ...input },
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
      orderBy: { order: 'asc' },
      select: { id: true, title: true, slug: true, status: true, order: true, updatedAt: true },
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
}

export const companiesService = new CompaniesService()
