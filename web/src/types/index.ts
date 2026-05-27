export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'SELLER'
}

export interface CompanySettings {
  id: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  siteTitle: string | null
  siteDescription: string | null
  keywords: string[]
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  address: string | null
  city: string | null
  state: string | null
  vehiclesPerPage: number
  showPrices: boolean
  currency: string
}

export interface Company {
  id: string
  name: string
  slug: string
  settings: CompanySettings | null
}

export interface AuthState {
  user: User | null
  company: Company | null
  accessToken: string | null
  refreshToken: string | null
}

export interface Vehicle {
  id: string
  title: string
  slug: string
  year: number
  mileage: number
  price: string
  priceOnRequest: boolean
  vehicleType: string
  fuelType: string
  transmission: string
  color: string | null
  doors: number | null
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'INACTIVE'
  featured: boolean
  viewCount: number
  coverImageUrl: string | null
  createdAt: string
  brand: { id: string; name: string }
  model: { id: string; name: string }
  images?: { id: string; url: string; order: number }[]
  features?: { feature: { id: string; name: string; category: string | null } }[]
  description?: string | null
  seats?: number | null
  engineSize?: string | null
  horsepower?: number | null
}

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  status: 'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'WON' | 'LOST'
  source: string
  createdAt: string
  vehicle?: { id: string; title: string; slug: string; coverImageUrl: string | null } | null
  _count?: { interactions: number }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    perPage: number
    lastPage: number
  }
}

export interface DashboardOverview {
  vehicles: {
    total: number
    available: number
    sold: number
    reserved: number
    inactive: number
  }
  leads: {
    total: number
    newThisMonth: number
    new: number
    contacted: number
    negotiating: number
    won: number
    lost: number
  }
  topViewedVehicles: Vehicle[]
  recentLeads: Lead[]
  leadsPerDay: { date: string; count: number }[]
}
