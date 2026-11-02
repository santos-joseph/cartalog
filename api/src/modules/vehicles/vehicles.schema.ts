import { z } from 'zod'

// Campos de ID opcionais — converte string vazia para undefined para não quebrar FK no Prisma
const optionalId = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().optional(),
)

const optionalText = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.string().optional(),
)

const vehicleFields = z.object({
  modelId: z.string().min(1).optional(),
  brandId: z.string().min(1).optional(),
  modelName: z.string().trim().min(1).max(120).optional(),
  categoryId: optionalId,
  fuelId: optionalId,
  transmissionId: optionalId,
  year: z.coerce.number().min(1950).max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().min(0).default(0),
  price: z.coerce.number().positive(),
  color: optionalText,
  description: optionalText,
  featureIds: z.array(z.string()).default([]),
  status: z.enum(['available', 'reserved', 'sold']).default('available'),
})

export const createVehicleSchema = vehicleFields.refine(
  (value) => Boolean(value.modelId || (value.brandId && value.modelName)),
  { message: 'Informe a marca e o modelo', path: ['modelName'] },
)

// Na edição, selecionar "Não informado" deve limpar a relação já salva.
const clearableId = z.preprocess(
  (v) => (v === '' ? null : v),
  z.string().min(1).nullable().optional(),
)

export const updateVehicleSchema = vehicleFields.partial().extend({
  categoryId: clearableId,
  fuelId: clearableId,
  transmissionId: clearableId,
}).refine(
  (value) => !value.brandId && !value.modelName || Boolean(value.brandId && value.modelName),
  { message: 'Informe a marca e o modelo juntos', path: ['modelName'] },
)

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
