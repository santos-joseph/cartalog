export type User = { id: string; name: string; email: string; role: 'SELLER' | 'OWNER' }
export type Company = { id: string; name: string; slug: string; logoUrl?: string | null }
export type Session = { user: User; company: Company }

export type LeadStatus = {
  id: string
  name: string
  kind: 'open' | 'won' | 'lost'
  position?: number | null
}

export type LeadVehicle = {
  id: string
  slug: string
  year: number
  model: { name: string; brand: { name: string } }
  images?: Array<{ imageUrl: string }>
}

export type Interaction = {
  id: string
  type: string
  note: string | null
  createdAt: string
  userId: string | null
}

export type Lead = {
  id: string
  name: string
  phone: string | null
  email: string | null
  message: string | null
  source: string | null
  createdAt: string
  status: LeadStatus | null
  assignedUser: { id: string; name: string } | null
  assignedUserId: string | null
  vehicle: LeadVehicle | null
  _count?: { interactions: number }
}

export type LeadDetail = Lead & { interactions: Interaction[] }

export type Page<T> = {
  data: T[]
  meta: { total: number; page: number; perPage: number; lastPage: number }
}
