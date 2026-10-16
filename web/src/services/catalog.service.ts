const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

function catalogFetch(path: string, slug: string, init?: RequestInit) {
  return fetch(`${API}/api/v1${path}`, {
    ...init,
    headers: { 'X-Tenant-Slug': slug, ...(init?.headers ?? {}) },
    next: { revalidate: 60 },
  })
}

export async function getCatalog(slug: string) {
  const r = await catalogFetch('/catalog', slug)
  if (!r.ok) return null
  return r.json()
}

export async function getCatalogVehicles(slug: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  const r = await catalogFetch(`/catalog/vehicles${qs}`, slug)
  if (!r.ok) return null
  return r.json()
}

export async function getCatalogVehicle(slug: string, vehicleSlug: string) {
  const r = await catalogFetch(`/catalog/vehicles/${vehicleSlug}`, slug)
  if (!r.ok) return null
  return r.json()
}

export async function submitLead(slug: string, data: Record<string, unknown>) {
  return fetch(`${API}/api/v1/leads/public`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-Slug': slug },
    body: JSON.stringify(data),
  })
}
