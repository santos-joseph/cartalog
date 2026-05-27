import { z } from 'zod'

export const createLeadSchema = z.object({
  vehicleId: z.string().optional(),
  name: z.string().min(2).max(200),
  email: z.email().optional().or(z.literal('')),
  phone: z.string().optional(),
  message: z.string().max(1000).optional(),
  source: z.enum(['CATALOG', 'WHATSAPP', 'PHONE', 'WALK_IN', 'REFERRAL', 'OTHER']).default('CATALOG'),
})

export const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'NEGOTIATING', 'WON', 'LOST']).optional(),
  assignedTo: z.string().optional(),
})

export const createInteractionSchema = z.object({
  type: z.enum(['call', 'email', 'whatsapp', 'note', 'visit']),
  description: z.string().min(1).max(2000),
})

export const leadsFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['NEW', 'CONTACTED', 'NEGOTIATING', 'WON', 'LOST']).optional(),
  search: z.string().optional(),
  vehicleId: z.string().optional(),
  assignedTo: z.string().optional(),
  orderBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type CreateInteractionInput = z.infer<typeof createInteractionSchema>
export type LeadsFilters = z.infer<typeof leadsFiltersSchema>
