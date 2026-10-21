const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'
export const platformTokenKey = 'cartalog-platform-token'
export class PlatformApiError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

export async function platformRequest<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}/api/v1/platform${path}`, {
    ...init,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = data?.details && typeof data.details === 'object' ? Object.values(data.details).flat().find((value) => typeof value === 'string') : null
    throw new PlatformApiError(typeof detail === 'string' ? detail : data?.error || data?.message || `Erro ${response.status}`, response.status)
  }
  return data as T
}
