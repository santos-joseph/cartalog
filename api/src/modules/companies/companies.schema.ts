import { z } from 'zod'

export const updateSettingsSchema = z.object({
  // Company fields
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  whatsapp: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  // SiteSettings
  showPrices: z.boolean().optional(),
  showWhatsappButton: z.boolean().optional(),
  showStoreNameWithLogo: z.boolean().optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.enum(['sans', 'serif', 'rounded']).optional(),
  homeHeadline: z.string().max(180).nullish(),
  homeSubheadline: z.string().max(500).nullish(),
  showHomeStats: z.boolean().optional(),
  // SeoSettings
  siteTitle: z.string().max(200).nullish(),
  siteDescription: z.string().max(500).nullish(),
  siteKeywords: z.string().max(500).nullish(),
  // CompanyLocation
  address: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().max(2).nullish(),
  zipCode: z.string().nullish(),
})

export const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  imageUrl: z.string().min(1).optional(),
  buttonText: z.string().max(100).optional(),
  buttonLink: z.string().max(500).optional(),
  position: z.coerce.number().default(0),
  isActive: z.boolean().default(false),
})

export const updateBannerSchema = createBannerSchema.partial()

const pageLink = z.string().max(500).refine((value) => /^\/(?!\/)/.test(value) || /^https:\/\//i.test(value), 'Use um caminho interno ou link HTTPS')
export const pageBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), eyebrow: z.string().max(80).default(''), title: z.string().min(1).max(180), subtitle: z.string().max(500).default('') }),
  z.object({ type: z.literal('text'), heading: z.string().max(180).default(''), body: z.string().min(1).max(10000) }),
  z.object({ type: z.literal('image'), imageUrl: z.string().regex(/^\/uploads\/pages\/[a-zA-Z0-9._-]+$/), alt: z.string().max(180).default(''), caption: z.string().max(300).default('') }),
  z.object({ type: z.literal('cta'), text: z.string().min(1).max(100), href: pageLink, style: z.enum(['primary', 'outline']).default('primary') }),
])

const pageBaseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens'),
  content: z.string().max(30000).optional(),
  blocks: z.array(pageBlockSchema).min(1).max(40).optional(),
  isPublished: z.boolean().default(false),
})

export const createPageSchema = pageBaseSchema.refine((value) => Boolean(value.blocks?.length || value.content?.trim()), 'Adicione conteúdo à página')
export const updatePageSchema = pageBaseSchema.partial()

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
export type CreateBannerInput = z.infer<typeof createBannerSchema>
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>
export type CreatePageInput = z.infer<typeof createPageSchema>
export type UpdatePageInput = z.infer<typeof updatePageSchema>
