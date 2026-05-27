import { z } from 'zod'

export const updateSettingsSchema = z.object({
  // Company fields
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  // SiteSettings
  showPrices: z.boolean().optional(),
  showWhatsappButton: z.boolean().optional(),
  // SeoSettings
  siteTitle: z.string().max(200).optional(),
  siteDescription: z.string().max(500).optional(),
  siteKeywords: z.string().max(500).optional(),
  // CompanyLocation
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().optional(),
})

export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().min(1),
  buttonText: z.string().max(100).optional(),
  buttonLink: z.string().max(500).optional(),
  position: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
})

export const updateBannerSchema = createBannerSchema.partial()

export const createPageSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens'),
  content: z.string().min(1),
  isPublished: z.boolean().default(false),
})

export const updatePageSchema = createPageSchema.partial()

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type CreateBannerInput = z.infer<typeof createBannerSchema>
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>
export type CreatePageInput = z.infer<typeof createPageSchema>
export type UpdatePageInput = z.infer<typeof updatePageSchema>
