import { Platform } from 'react-native'
import Constants from 'expo-constants'

function localApiUrl() {
  if (Platform.OS === 'web') return 'http://localhost:3333'

  // Expo Go exposes the Metro host, which is the same computer running the API.
  const host = Constants.expoConfig?.hostUri?.split(':')[0]
  if (host && (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host))) {
    return `http://${host}:3333`
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:3333' : 'http://localhost:3333'
}

export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || localApiUrl()

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string, public serverMessage?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function normalizeApiUrl(value: string) {
  const url = value.trim().replace(/\/+$/, '').replace(/\/api\/v1$/, '')
  if (!/^https?:\/\/[a-z0-9.:-]+$/i.test(url)) {
    throw new Error('Informe o endereço completo da API, por exemplo http://192.168.1.10:3333.')
  }
  return url
}

export async function apiFetch<T>(baseUrl: string, path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}/api/v1${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new Error('Não foi possível conectar à API. Confira o endereço e a rede do celular.')
  }

  const raw = await response.text()
  let data: (T & { error?: string; code?: string }) | undefined
  try { data = raw ? JSON.parse(raw) : undefined } catch { data = undefined }
  if (!response.ok) {
    const message = response.status === 401 ? 'Sessão expirada ou credenciais inválidas.'
      : response.status === 403 ? 'Você não tem permissão para esta ação.'
      : response.status === 409 ? 'Este lead já foi assumido ou alterado. Atualize a lista.'
      : response.status === 404 ? 'Lead não encontrado ou indisponível.'
      : data?.error || 'Não foi possível concluir a solicitação.'
    throw new ApiError(message, response.status, data?.code, data?.error)
  }
  return data as T
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.'
}
