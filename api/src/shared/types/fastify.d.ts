import '@fastify/jwt'
import 'fastify'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      companyId: string
      role: string
    }
    user: {
      sub: string
      companyId: string
      role: string
      name?: string
      email?: string
    }
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    platformUser: { id: string; name: string; email: string; role: string }
    tenant: {
      id: string
      name: string
      slug: string
      logoUrl: string | null
      primaryColor: string | null
      secondaryColor: string | null
      description: string | null
      phone: string | null
      whatsapp: string | null
      email: string | null
      createdAt: Date
      siteSettings: {
        id: string
        theme: string | null
        showPrices: boolean
        showWhatsappButton: boolean
        showStoreNameWithLogo: boolean
        maintenanceEnabled: boolean
        maintenanceMessage: string | null
      } | null
      seoSettings: {
        id: string
        metaTitle: string | null
        metaDescription: string | null
        metaKeywords: string | null
      } | null
      companyLocations: Array<{
        id: string
        address: string | null
        city: string | null
        state: string | null
      }>
    }
  }
}
