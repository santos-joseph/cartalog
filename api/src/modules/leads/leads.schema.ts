import { z } from 'zod'

export const createLeadSchema = z.object({
  vehicleId: z.string().optional(),
  name: z.string().min(2).max(200),
  email: z.email().optional().or(z.literal('')),
  phone: z.string().optional(),
  message: z.string().max(1000).optional(),
  source: z.string().optional(),
})

export const updateLeadSchema = z.object({
  statusId: z.string().nullish(),
  assignedUserId: z.string().optional(),
})

export const createInteractionSchema = z.object({
  type: z.string().min(1),
  note: z.string().min(1).max(2000).optional(),
})

export const leadsFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  statusId: z.string().optional(),
  search: z.string().optional(),
  vehicleId: z.string().optional(),
  assignedUserId: z.string().optional(),
  orderBy: z.enum(['createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const createLeadStatusSchema = z.object({
  name: z.string().min(1).max(100),
  position: z.coerce.number().optional(),
})

export const updateLeadStatusSchema = createLeadStatusSchema.partial()

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type CreateInteractionInput = z.infer<typeof createInteractionSchema>
export type LeadsFilters = z.infer<typeof leadsFiltersSchema>
export type CreateLeadStatusInput = z.infer<typeof createLeadStatusSchema>
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>
