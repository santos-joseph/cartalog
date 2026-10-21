const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'

function catalogFetch(path: string, slug: string, init?: RequestInit) {
  return fetch(`${API}/api/v1${path}`, {
    ...init,
    headers: { 'X-Tenant-Slug': slug, ...(init?.headers ?? {}) },
    cache: 'no-store',
  })
}

export async function getCatalogStatus(slug: string): Promise<{ name: string; logoUrl: string | null; maintenanceEnabled: boolean; maintenanceMessage: string | null } | null> {
  try {
    const response = await catalogFetch('/catalog/status', slug)
    return response.ok ? response.json() : null
  } catch { return null }
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

export async function getCatalogPage(slug: string, pageSlug: string) {
  const r = await catalogFetch(`/catalog/pages/${encodeURIComponent(pageSlug)}`, slug)
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
