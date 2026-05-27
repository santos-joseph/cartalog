import { z } from 'zod'

export const createVehicleSchema = z.object({
  modelId: z.string().min(1),
  categoryId: z.string().optional(),
  fuelId: z.string().optional(),
  transmissionId: z.string().optional(),
  year: z.coerce.number().min(1950).max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().min(0).default(0),
  price: z.coerce.number().positive(),
  color: z.string().optional(),
  description: z.string().optional(),
  featureIds: z.array(z.string()).default([]),
})

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.string().optional(),
})

export const vehicleFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(48).default(12),
  search: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  categoryId: z.string().optional(),
  fuelId: z.string().optional(),
  transmissionId: z.string().optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  status: z.string().optional(),
  orderBy: z.enum(['createdAt', 'price', 'year', 'mileage']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>
