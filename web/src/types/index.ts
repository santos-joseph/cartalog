export interface User {
  id: string
  name: string
  email: string
  role: 'OWNER' | 'SELLER'
}

export interface Company {
  id: string
  name: string
  slug: string
  primaryColor?: string | null
  logoUrl?: string | null
  showPrices?: boolean
}

export interface AuthState {
  user: User | null
  company: Company | null
  accessToken: string | null
  refreshToken: string | null
}

export interface VehicleImage {
  id: string
  imageUrl: string
  isCover: boolean
  position: number | null
}

export interface Vehicle {
  id: string
  slug: string
  year: number
  mileage: number
  price: string
  color: string | null
  status: string
  createdAt: string
  model: {
    id: string
    name: string
    brand: { id: string; name: string }
  }
  fuel: { id: string; name: string } | null
  transmission: { id: string; name: string } | null
  category: { id: string; name: string } | null
  images?: VehicleImage[]
  features?: { feature: { id: string; name: string } }[]
  description?: string | null
}

export interface LeadStatus {
  id: string
  name: string
  position: number | null
  kind: 'open' | 'won' | 'lost'
}

export interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  source: string | null
  createdAt: string
  status: LeadStatus | null
  assignedUser: { id: string; name: string } | null
  vehicle?: {
    id: string
    slug: string
    year: number
    model: { name: string; brand: { name: string } }
    images: { imageUrl: string }[]
  } | null
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
  }
  leads: {
    total: number
    newThisMonth: number
    byStatus: { id: string; name: string; kind: 'open' | 'won' | 'lost'; position: number | null; count: number }[]
  }
  topViewedVehicles: Array<{
    id: string
    slug: string
    year: number
    price: string
    viewCount: number
    model: { name: string; brand: { name: string } }
    images: { imageUrl: string }[]
  }>
  recentLeads: Lead[]
  leadsPerDay: { date: string; count: number }[]
}
