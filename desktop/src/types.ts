export type Owner = { id: string; name: string; email: string; role: 'OWNER' }
export type Company = { id: string; name: string; slug: string; logoUrl?: string | null }
export type PlatformUser = { id: string; name: string; email: string; role: 'PLATFORM_OWNER' | 'PLATFORM_ADMIN'; isActive?: boolean; createdAt?: string }
export type StoreDesktopSession = { scope: 'company'; user: Owner; company: Company }
export type PlatformDesktopSession = { scope: 'platform'; user: PlatformUser }
export type DesktopSession = StoreDesktopSession | PlatformDesktopSession
export type Bootstrap = { session: DesktopSession | null; apiOrigin: string; webBaseUrl: string }
export type Seller = { id: string; name: string; email: string; role: 'SELLER' | 'OWNER'; isActive: boolean; createdAt: string }

export type LoginInput = { email: string; password: string }
export type PlatformOverview = { companies: number; demoRequests: number; activeSubscriptions: number; plans: number }
export type PlatformPlan = { id: string; code: string; name: string; priceCents: number; billingInterval: string; isActive: boolean; _count?: { subscriptions: number } }
export type PlatformSubscription = { planId: string; status: string; currentPeriodEnd: string | null; notes: string | null; plan: PlatformPlan }
export type PlatformCompany = { id: string; name: string; slug: string; email: string; createdAt: string; users: { name: string; email: string }[]; subscription: PlatformSubscription | null; siteSettings: { maintenanceEnabled: boolean } | null; _count: { vehicles: number; leads: number; users: number } }
export type DemoRequest = { id: string; name: string; email: string; companyName?: string | null; phone?: string | null; message?: string | null; createdAt: string }
export type PlatformAudit = { id: string; action: string; target: string; createdAt: string; actor: { name: string; email: string } }
export type PlatformCompanyInput = { companyName: string; companyEmail: string; companyPhone?: string; userName: string; userEmail: string; password: string; planId?: string }
export type PlatformPlanInput = { code: string; name: string; priceCents: number; billingInterval: 'monthly' | 'yearly'; isActive: boolean }
export type PlatformSubscriptionInput = { planId: string; status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'canceled'; currentPeriodEnd: string | null; notes: string | null }
export type SellerInput = { name: string; email: string; password: string }

export type StoreSettings = {
  primaryColor: string
  secondaryColor: string
  whatsapp: string | null
  phone: string | null
  email: string | null
  showPrices: boolean
  showWhatsappButton: boolean
  backgroundColor: string
  fontFamily: 'sans' | 'serif' | 'rounded'
  homeHeadline: string | null
  homeSubheadline: string | null
  showHomeStats: boolean
  siteTitle: string | null
  siteDescription: string | null
  siteKeywords: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
}

export type MaintenanceSettings = { maintenanceEnabled: boolean; maintenanceMessage: string | null; maintenanceUpdatedAt: string | null }

export type Category = { id: string; name: string; slug: string; _count: { vehicles: number } }
export type PageBlock =
  | { type: 'hero'; eyebrow: string; title: string; subtitle: string }
  | { type: 'text'; heading: string; body: string }
  | { type: 'image'; imageUrl: string; alt: string; caption: string }
  | { type: 'cta'; text: string; href: string; style: 'primary' | 'outline' }
export type PageSummary = { id: string; title: string; slug: string; isPublished: boolean }
export type StorePage = PageSummary & { content: string; blocks?: PageBlock[] | null }
export type Banner = {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  buttonText: string | null
  buttonLink: string | null
  position: number | null
  isActive: boolean
}
export type BannerInput = {
  title: string
  subtitle?: string
  buttonText?: string
  buttonLink?: string
  position?: number
  isActive?: boolean
}
export type PageInput = { title: string; slug: string; blocks: PageBlock[]; isPublished: boolean }
export type ReferenceItem = { id: string; name: string }
export type VehicleImage = { id: string; imageUrl: string; isCover: boolean; position: number }
export type Vehicle = {
  id: string; slug: string; year: number; mileage: number; price: string | number; color: string | null
  description?: string | null; status: 'available' | 'reserved' | 'sold'
  model: ReferenceItem & { brand: ReferenceItem }
  category?: ReferenceItem | null; fuel?: ReferenceItem | null; transmission?: ReferenceItem | null
  images: VehicleImage[]; features?: Array<{ feature: ReferenceItem }>
}
export type VehicleInput = {
  modelId: string; categoryId?: string; fuelId?: string; transmissionId?: string
  year: number; mileage: number; price: number; color?: string; description?: string
  featureIds: string[]; status: Vehicle['status']
}
export type VehicleList = { data: Vehicle[]; meta: { page: number; total: number; lastPage: number } }

export interface CartalogBridge {
  window: {
    minimize(): Promise<true>
    toggleMaximize(): Promise<boolean>
    close(): Promise<true>
    isMaximized(): Promise<boolean>
    onStateChange(callback: (maximized: boolean) => void): () => void
  }
  bootstrap(): Promise<Bootstrap>
  health(): Promise<boolean>
  login(input: LoginInput): Promise<DesktopSession>
  logout(): Promise<true>
  platform: {
    overview(): Promise<PlatformOverview>
    companies(): Promise<PlatformCompany[]>
    createCompany(input: PlatformCompanyInput): Promise<unknown>
    plans(): Promise<PlatformPlan[]>
    createPlan(input: PlatformPlanInput): Promise<PlatformPlan>
    updatePlan(id: string, input: Partial<PlatformPlanInput>): Promise<PlatformPlan>
    updateSubscription(id: string, input: PlatformSubscriptionInput): Promise<PlatformSubscription>
    requests(): Promise<DemoRequest[]>
    admins(): Promise<PlatformUser[]>
    createAdmin(input: { name: string; email: string; password: string }): Promise<PlatformUser>
    setAdminActive(id: string, input: { isActive: boolean }): Promise<PlatformUser>
    audit(): Promise<PlatformAudit[]>
  }
  catalog: { open(): Promise<true> }
  team: {
    list(): Promise<Seller[]>
    create(input: SellerInput): Promise<Seller>
    update(id: string, input: { name: string }): Promise<Seller>
    deactivate(id: string): Promise<null>
    reactivate(id: string): Promise<Seller>
  }
  company: { get(): Promise<Company> }
  settings: {
    get(): Promise<StoreSettings>
    save(input: StoreSettings): Promise<StoreSettings>
    uploadLogo(): Promise<{ logoUrl: string } | null>
  }
  maintenance: {
    get(): Promise<MaintenanceSettings>
    save(input: { enabled: boolean; message: string | null }): Promise<MaintenanceSettings>
  }
  categories: {
    list(): Promise<Category[]>
    create(input: { name: string }): Promise<Category>
    update(id: string, input: { name: string }): Promise<Category>
    delete(id: string): Promise<null>
  }
  pages: {
    list(): Promise<PageSummary[]>
    get(id: string): Promise<StorePage>
    create(input: PageInput): Promise<StorePage>
    update(id: string, input: PageInput): Promise<StorePage>
    delete(id: string): Promise<null>
    uploadImage(): Promise<{ imageUrl: string } | null>
  }
  banners: {
    list(): Promise<Banner[]>
    create(input: BannerInput): Promise<Banner>
    update(id: string, input: Partial<BannerInput>): Promise<Banner>
    delete(id: string): Promise<null>
    uploadImage(id: string): Promise<Banner | null>
  }
  vehicles: {
    list(filters: { page?: number; search?: string; status?: string }): Promise<VehicleList>
    get(id: string): Promise<Vehicle>
    create(input: VehicleInput): Promise<Vehicle>
    update(id: string, input: VehicleInput): Promise<Vehicle>
    delete(id: string): Promise<null>
    brands(): Promise<ReferenceItem[]>
    models(brandId: string): Promise<ReferenceItem[]>
    fuels(): Promise<ReferenceItem[]>
    transmissions(): Promise<ReferenceItem[]>
    features(): Promise<ReferenceItem[]>
    uploadImages(id: string): Promise<VehicleImage[] | null>
    deleteImage(id: string, imageId: string): Promise<null>
    setCover(id: string, imageId: string): Promise<VehicleImage>
  }
}

declare global {
  interface Window { cartalog: CartalogBridge }
}
