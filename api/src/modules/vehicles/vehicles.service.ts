import { Prisma } from '../../../generated/prisma/client'
import { prisma } from '../../database/prisma'
import { NotFoundError, AppError } from '../../shared/errors/app-error'
import { slugify, uniqueSlug } from '../../shared/utils/slug'
import { getPaginationParams, buildMeta } from '../../shared/utils/pagination'
import type { CreateVehicleInput, UpdateVehicleInput, VehicleFilters } from './vehicles.schema'

const vehicleSelect = {
  id: true,
  title: true,
  slug: true,
  year: true,
  mileage: true,
  price: true,
  priceOnRequest: true,
  vehicleType: true,
  fuelType: true,
  transmission: true,
  color: true,
  doors: true,
  status: true,
  featured: true,
  viewCount: true,
  coverImageUrl: true,
  createdAt: true,
  brand: { select: { id: true, name: true } },
  model: { select: { id: true, name: true } },
} satisfies Prisma.VehicleSelect

export class VehiclesService {
  async list(companyId: string, filters: VehicleFilters) {
    const { page, perPage, skip, take } = getPaginationParams(filters)

    const where: Prisma.VehicleWhereInput = {
      companyId,
      ...(filters.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.brandId && { brandId: filters.brandId }),
      ...(filters.modelId && { modelId: filters.modelId }),
      ...(filters.vehicleType && { vehicleType: filters.vehicleType }),
      ...(filters.fuelType && { fuelType: filters.fuelType }),
      ...(filters.transmission && { transmission: filters.transmission }),
      ...(filters.status && { status: filters.status }),
      ...(filters.featured !== undefined && { featured: filters.featured }),
      ...(filters.yearMin || filters.yearMax
        ? { year: { gte: filters.yearMin, lte: filters.yearMax } }
        : {}),
      ...(filters.priceMin || filters.priceMax
        ? { price: { gte: filters.priceMin, lte: filters.priceMax } }
        : {}),
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        select: vehicleSelect,
        orderBy: { [filters.orderBy]: filters.order },
        skip,
        take,
      }),
      prisma.vehicle.count({ where }),
    ])

    return { data: vehicles, meta: buildMeta(total, page, perPage) }
  }

  async findById(companyId: string, vehicleId: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, companyId },
      include: {
        brand: true,
        model: true,
        images: { orderBy: { order: 'asc' } },
        features: { include: { feature: true } },
      },
    })
    if (!vehicle) throw new NotFoundError('Vehicle')
    return vehicle
  }

  async findBySlug(companyId: string, slug: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { companyId_slug: { companyId, slug } },
      include: {
        brand: true,
        model: true,
        images: { orderBy: { order: 'asc' } },
        features: { include: { feature: true } },
      },
    })
    if (!vehicle) throw new NotFoundError('Vehicle')

    // Incrementa view count (fire and forget)
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { viewCount: { increment: 1 } } }).catch(() => null)

    return vehicle
  }

  async create(companyId: string, input: CreateVehicleInput) {
    const baseSlug = slugify(input.title)
    const slug = await this.generateUniqueSlug(companyId, baseSlug)

    const { featureIds, price, ...rest } = input

    return prisma.vehicle.create({
      data: {
        ...rest,
        price: new (await import('decimal.js')).Decimal(price),
        companyId,
        slug,
        features: featureIds.length
          ? { create: featureIds.map((featureId) => ({ featureId })) }
          : undefined,
      },
      include: { brand: true, model: true, images: true, features: { include: { feature: true } } },
    })
  }

  async update(companyId: string, vehicleId: string, input: UpdateVehicleInput) {
    await this.findVehicleOrThrow(companyId, vehicleId)

    const { featureIds, price, ...rest } = input

    if (featureIds !== undefined) {
      await prisma.vehicleFeatureMap.deleteMany({ where: { vehicleId } })
    }

    return prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...rest,
        ...(price !== undefined && { price: new (await import('decimal.js')).Decimal(price) }),
        ...(featureIds !== undefined && {
          features: { create: featureIds.map((featureId) => ({ featureId })) },
        }),
      },
      include: { brand: true, model: true, images: true, features: { include: { feature: true } } },
    })
  }

  async delete(companyId: string, vehicleId: string) {
    await this.findVehicleOrThrow(companyId, vehicleId)
    await prisma.vehicle.delete({ where: { id: vehicleId } })
  }

  async addImages(companyId: string, vehicleId: string, urls: string[]) {
    await this.findVehicleOrThrow(companyId, vehicleId)

    const existing = await prisma.vehicleImage.count({ where: { vehicleId } })
    if (existing + urls.length > 20) {
      throw new AppError('Maximum 20 images per vehicle', 400)
    }

    const images = await prisma.$transaction(
      urls.map((url, i) =>
        prisma.vehicleImage.create({ data: { vehicleId, url, order: existing + i } }),
      ),
    )

    return images
  }

  async deleteImage(companyId: string, vehicleId: string, imageId: string) {
    await this.findVehicleOrThrow(companyId, vehicleId)
    const image = await prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId } })
    if (!image) throw new NotFoundError('Image')
    await prisma.vehicleImage.delete({ where: { id: imageId } })
  }

  async setCoverImage(companyId: string, vehicleId: string, imageUrl: string) {
    await this.findVehicleOrThrow(companyId, vehicleId)
    return prisma.vehicle.update({ where: { id: vehicleId }, data: { coverImageUrl: imageUrl } })
  }

  async getBrands() {
    return prisma.brand.findMany({ where: { active: true }, orderBy: { name: 'asc' } })
  }

  async getModels(brandId?: string) {
    return prisma.vehicleModel.findMany({
      where: { active: true, ...(brandId && { brandId }) },
      orderBy: { name: 'asc' },
      include: { brand: { select: { id: true, name: true } } },
    })
  }

  async getFeatures() {
    return prisma.vehicleFeature.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] })
  }

  private async findVehicleOrThrow(companyId: string, vehicleId: string) {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, companyId } })
    if (!vehicle) throw new NotFoundError('Vehicle')
    return vehicle
  }

  private async generateUniqueSlug(companyId: string, base: string): Promise<string> {
    let slug = base
    let counter = 0

    while (true) {
      const existing = await prisma.vehicle.findUnique({ where: { companyId_slug: { companyId, slug } } })
      if (!existing) return slug
      counter++
      slug = uniqueSlug(base, counter)
    }
  }
}

export const vehiclesService = new VehiclesService()
