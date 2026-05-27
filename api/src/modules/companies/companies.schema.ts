import { z } from 'zod'

export const updateSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  siteTitle: z.string().max(100).optional(),
  siteDescription: z.string().max(300).optional(),
  keywords: z.array(z.string()).max(20).optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  vehiclesPerPage: z.coerce.number().min(4).max(48).optional(),
  showPrices: z.boolean().optional(),
})

export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  linkUrl: z.string().url().optional(),
  order: z.coerce.number().default(0),
})

export const updateBannerSchema = createBannerSchema.partial().extend({
  active: z.boolean().optional(),
})

export const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens'),
  content: z.string().min(1),
  status: z.enum(['PUBLISHED', 'DRAFT']).default('DRAFT'),
  order: z.coerce.number().default(0),
})

export const updatePageSchema = createPageSchema.partial()

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type CreateBannerInput = z.infer<typeof createBannerSchema>
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>
export type CreatePageInput = z.infer<typeof createPageSchema>
export type UpdatePageInput = z.infer<typeof updatePageSchema>
