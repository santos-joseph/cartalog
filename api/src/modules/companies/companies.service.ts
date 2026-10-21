import { prisma } from '../../database/prisma'
import { Prisma } from '../../../generated/prisma/client'
import { NotFoundError, ConflictError, AppError } from '../../shared/errors/app-error'
import type {
  UpdateSettingsInput,
  CreateBannerInput,
  UpdateBannerInput,
  CreatePageInput,
  UpdatePageInput,
} from './companies.schema'
import { uploadsService } from '../uploads/uploads.service'

function plainPageContent(blocks: NonNullable<CreatePageInput['blocks']>) {
  return blocks.map((block) => block.type === 'hero' ? [block.title, block.subtitle].join(' ') : block.type === 'text' ? [block.heading, block.body].join(' ') : block.type === 'image' ? [block.alt, block.caption].join(' ') : block.text).join('\n\n').trim()
}

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
      primaryColor: company.primaryColor || '#d20a1e',
      secondaryColor: company.secondaryColor || '#a60818',
      whatsapp: company.whatsapp || null,
      phone: company.phone || null,
      email: company.email || null,
      showPrices: siteSettings?.showPrices ?? true,
      showWhatsappButton: siteSettings?.showWhatsappButton ?? true,
      backgroundColor: siteSettings?.backgroundColor || '#fbfbfd',
      fontFamily: siteSettings?.fontFamily || 'sans',
      homeHeadline: siteSettings?.homeHeadline ?? null,
      homeSubheadline: siteSettings?.homeSubheadline ?? null,
      showHomeStats: siteSettings?.showHomeStats ?? true,
      siteTitle: seoSettings?.metaTitle ?? null,
      siteDescription: seoSettings?.metaDescription ?? null,
      siteKeywords: seoSettings?.metaKeywords ?? null,
      address: location?.address || null,
      city: location?.city || null,
      state: location?.state || null,
      zipCode: location?.zipCode || null,
    }
  }

  async updateSettings(companyId: string, input: UpdateSettingsInput) {
    const {
      primaryColor, secondaryColor, whatsapp, phone, email,
      showPrices, showWhatsappButton, backgroundColor, fontFamily, homeHeadline, homeSubheadline, showHomeStats,
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
          ...(backgroundColor !== undefined && { backgroundColor }),
          ...(fontFamily !== undefined && { fontFamily }),
          ...(homeHeadline !== undefined && { homeHeadline }),
          ...(homeSubheadline !== undefined && { homeSubheadline }),
          ...(showHomeStats !== undefined && { showHomeStats }),
        },
        create: { companyId, showPrices: showPrices ?? true, showWhatsappButton: showWhatsappButton ?? true, backgroundColor: backgroundColor ?? '#fbfbfd', fontFamily: fontFamily ?? 'sans', homeHeadline: homeHeadline ?? null, homeSubheadline: homeSubheadline ?? null, showHomeStats: showHomeStats ?? true },
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
    ])

    if (address !== undefined || city !== undefined || state !== undefined || zipCode !== undefined) {
      const existingLocation = await prisma.companyLocation.findFirst({ where: { companyId } })
      if (existingLocation) {
        await prisma.companyLocation.update({
          where: { id: existingLocation.id },
          data: {
            ...(address !== undefined && { address }),
            ...(city !== undefined && { city }),
            ...(state !== undefined && { state }),
            ...(zipCode !== undefined && { zipCode }),
          },
        })
      } else {
        await prisma.companyLocation.create({
          data: { companyId, address, city, state, zipCode },
        })
      }
    }

    return this.getSettings(companyId)
  }

  async updateLogo(companyId: string, logoUrl: string) {
    const previous = await prisma.company.findUnique({ where: { id: companyId }, select: { logoUrl: true } })
    const company = await prisma.company.update({ where: { id: companyId }, data: { logoUrl } })
    if (previous?.logoUrl && previous.logoUrl !== logoUrl) await uploadsService.deleteFile(previous.logoUrl)
    return company
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
      data: {
        companyId,
        ...input,
        imageUrl: input.imageUrl ?? '',
        isActive: Boolean(input.imageUrl) && input.isActive,
        position: input.position ?? count,
      },
    })
  }

  async updateBanner(companyId: string, bannerId: string, input: UpdateBannerInput) {
    const banner = await this.findBannerOrThrow(companyId, bannerId)
    if (input.isActive && !(input.imageUrl ?? banner.imageUrl)) {
      throw new AppError('Adicione uma imagem antes de publicar o banner', 422)
    }
    const updated = await prisma.banner.update({ where: { id: bannerId }, data: input })
    if (input.imageUrl && banner.imageUrl && input.imageUrl !== banner.imageUrl) {
      await uploadsService.deleteFile(banner.imageUrl)
    }
    return updated
  }

  async deleteBanner(companyId: string, bannerId: string) {
    const banner = await this.findBannerOrThrow(companyId, bannerId)
    await prisma.banner.delete({ where: { id: bannerId } })
    if (banner.imageUrl) await uploadsService.deleteFile(banner.imageUrl)
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

  async getPageById(companyId: string, pageId: string) {
    return this.findPageOrThrow(companyId, pageId)
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
    return prisma.page.create({ data: { companyId, title: input.title, slug: input.slug, isPublished: input.isPublished, content: input.blocks ? plainPageContent(input.blocks) : input.content ?? '', blocks: input.blocks as Prisma.InputJsonValue | undefined } })
  }

  async updatePage(companyId: string, pageId: string, input: UpdatePageInput) {
    await this.findPageOrThrow(companyId, pageId)

    if (input.slug) {
      const conflict = await prisma.page.findFirst({
        where: { companyId, slug: input.slug, NOT: { id: pageId } },
      })
      if (conflict) throw new ConflictError(`Page with slug "${input.slug}"`)
    }

    const { blocks, content, ...rest } = input
    return prisma.page.update({ where: { id: pageId }, data: { ...rest, ...(blocks !== undefined && { blocks: blocks as Prisma.InputJsonValue, content: plainPageContent(blocks) }), ...(blocks === undefined && content !== undefined && { content }) } })
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
