import { z } from 'zod'

export const createVehicleSchema = z.object({
  brandId: z.string().min(1),
  modelId: z.string().min(1),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  year: z.coerce.number().min(1950).max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().min(0).default(0),
  price: z.coerce.number().positive(),
  priceOnRequest: z.coerce.boolean().default(false),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'SUV', 'PICKUP']),
  fuelType: z.enum(['FLEX', 'GASOLINE', 'ETHANOL', 'DIESEL', 'ELECTRIC', 'HYBRID']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'SEMI_AUTO']),
  color: z.string().optional(),
  doors: z.coerce.number().min(0).max(10).optional(),
  seats: z.coerce.number().min(1).max(50).optional(),
  engineSize: z.string().optional(),
  horsepower: z.coerce.number().optional(),
  licensePlate: z.string().optional(),
  featured: z.coerce.boolean().default(false),
  featureIds: z.array(z.string()).default([]),
})

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum(['AVAILABLE', 'SOLD', 'RESERVED', 'INACTIVE']).optional(),
})

export const vehicleFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(48).default(12),
  search: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  vehicleType: z.enum(['CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'SUV', 'PICKUP']).optional(),
  fuelType: z.enum(['FLEX', 'GASOLINE', 'ETHANOL', 'DIESEL', 'ELECTRIC', 'HYBRID']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'CVT', 'SEMI_AUTO']).optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  status: z.enum(['AVAILABLE', 'SOLD', 'RESERVED', 'INACTIVE']).optional(),
  featured: z.coerce.boolean().optional(),
  orderBy: z.enum(['createdAt', 'price', 'year', 'mileage', 'viewCount']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>
