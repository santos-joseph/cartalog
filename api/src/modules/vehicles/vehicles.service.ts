import { Prisma } from '../../../generated/prisma/client'
import { prisma } from '../../database/prisma'
import { NotFoundError, AppError } from '../../shared/errors/app-error'
import { slugify, uniqueSlug } from '../../shared/utils/slug'
import { getPaginationParams, buildMeta } from '../../shared/utils/pagination'
import type { CreateVehicleInput, UpdateVehicleInput, VehicleFilters } from './vehicles.schema'

const vehicleSelect = {
  id: true,
  slug: true,
  year: true,
  mileage: true,
  price: true,
  color: true,
  status: true,
  createdAt: true,
  model: {
    select: {
      id: true,
      name: true,
      brand: { select: { id: true, name: true } },
    },
  },
  fuel: { select: { id: true, name: true } },
  transmission: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  images: {
    where: { isCover: true },
    take: 1,
    select: { imageUrl: true },
  },
} satisfies Prisma.VehicleSelect

export class VehiclesService {
  async list(companyId: string, filters: VehicleFilters) {
    const { page, perPage, skip, take } = getPaginationParams(filters)

    const where: Prisma.VehicleWhereInput = {
      companyId,
      ...(filters.search && {
        OR: [
          { description: { contains: filters.search, mode: 'insensitive' } },
          { model: { name: { contains: filters.search, mode: 'insensitive' } } },
          { model: { brand: { name: { contains: filters.search, mode: 'insensitive' } } } },
          { color: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.brandId && { model: { brandId: filters.brandId } }),
      ...(filters.modelId && { modelId: filters.modelId }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.fuelId && { fuelId: filters.fuelId }),
      ...(filters.transmissionId && { transmissionId: filters.transmissionId }),
      ...(filters.status && { status: filters.status }),
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
        model: { include: { brand: true } },
        fuel: true,
        transmission: true,
        category: true,
        images: { orderBy: { position: 'asc' } },
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
        model: { include: { brand: true } },
        fuel: true,
        transmission: true,
        category: true,
        images: { orderBy: { position: 'asc' } },
        features: { include: { feature: true } },
      },
    })
    if (!vehicle) throw new NotFoundError('Vehicle')

    prisma.vehicleView.create({ data: { vehicleId: vehicle.id } }).catch(() => null)

    return vehicle
  }

  async create(companyId: string, input: CreateVehicleInput) {
    const model = await prisma.model.findUnique({
      where: { id: input.modelId },
      include: { brand: true },
    })
    if (!model) throw new NotFoundError('Model')

    const baseSlug = slugify(`${model.brand.name}-${model.name}-${input.year}`)
    const slug = await this.generateUniqueSlug(companyId, baseSlug)

    const { featureIds, price, ...rest } = input

    return prisma.vehicle.create({
      data: {
        ...rest,
        price,
        companyId,
        slug,
        features: featureIds.length
          ? { create: featureIds.map((featureId) => ({ featureId })) }
          : undefined,
      },
      include: {
        model: { include: { brand: true } },
        fuel: true,
        transmission: true,
        category: true,
        images: true,
        features: { include: { feature: true } },
      },
    })
  }

  async update(companyId: string, vehicleId: string, input: UpdateVehicleInput) {
    await this.findVehicleOrThrow(companyId, vehicleId)

    const { featureIds, price, ...rest } = input

    if (featureIds !== undefined) {
      await prisma.vehicleFeature.deleteMany({ where: { vehicleId } })
    }

    return prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...rest,
        ...(price !== undefined && { price }),
        ...(featureIds !== undefined && {
          features: { create: featureIds.map((featureId) => ({ featureId })) },
        }),
      },
      include: {
        model: { include: { brand: true } },
        fuel: true,
        transmission: true,
        category: true,
        images: true,
        features: { include: { feature: true } },
      },
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
      urls.map((imageUrl, i) =>
        prisma.vehicleImage.create({ data: { vehicleId, imageUrl, position: existing + i } }),
      ),
    )

    if (existing === 0 && images.length > 0) {
      await prisma.vehicleImage.update({ where: { id: images[0].id }, data: { isCover: true } })
    }

    return images
  }

  async deleteImage(companyId: string, vehicleId: string, imageId: string) {
    await this.findVehicleOrThrow(companyId, vehicleId)
    const image = await prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId } })
    if (!image) throw new NotFoundError('Image')
    await prisma.vehicleImage.delete({ where: { id: imageId } })
  }

  async setCoverImage(companyId: string, vehicleId: string, imageId: string) {
    await this.findVehicleOrThrow(companyId, vehicleId)
    await prisma.vehicleImage.updateMany({ where: { vehicleId }, data: { isCover: false } })
    return prisma.vehicleImage.update({ where: { id: imageId }, data: { isCover: true } })
  }

  async getBrands() {
    return prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { models: { orderBy: { name: 'asc' }, select: { id: true, name: true } } },
    })
  }

  async getModels(brandId?: string) {
    return prisma.model.findMany({
      where: { ...(brandId && { brandId }) },
      orderBy: { name: 'asc' },
      include: { brand: { select: { id: true, name: true } } },
    })
  }

  async getFuels() {
    return prisma.fuel.findMany({ orderBy: { name: 'asc' } })
  }

  async getTransmissions() {
    return prisma.transmission.findMany({ orderBy: { name: 'asc' } })
  }

  async getFeatures() {
    return prisma.feature.findMany({ orderBy: { name: 'asc' } })
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
