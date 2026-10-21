import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError, DEFAULT_API_URL, apiFetch, normalizeApiUrl } from '@/lib/api'
import { storage } from '@/lib/storage'
import type { Company, Session, User } from '@/lib/types'

const API_URL_KEY = 'cartalog.api-url'
const REFRESH_KEY = 'cartalog.seller-refresh'

type LoginResult = { accessToken: string; refreshToken: string; user: User; company: Company }
type MeResult = User & { company: Company }

type AuthContextValue = {
  status: 'loading' | 'ready' | 'error'
  bootError: string | null
  session: Session | null
  apiUrl: string
  login: (input: { companySlug: string; email: string; password: string; apiUrl: string }) => Promise<void>
  logout: () => Promise<void>
  retryRestore: () => Promise<void>
  request: <T>(path: string, init?: RequestInit) => Promise<T>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')
  const [bootError, setBootError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const apiUrlRef = useRef(DEFAULT_API_URL)
  const accessRef = useRef<string | null>(null)
  const refreshRef = useRef<string | null>(null)
  const refreshTaskRef = useRef<Promise<string> | null>(null)

  const clearSession = useCallback(async () => {
    accessRef.current = null
    refreshRef.current = null
    setSession(null)
    await storage.remove(REFRESH_KEY)
  }, [])

  const refreshAccess = useCallback(async () => {
    if (!refreshRef.current) throw new ApiError('Entre novamente para continuar.', 401)
    if (!refreshTaskRef.current) {
      refreshTaskRef.current = apiFetch<{ accessToken: string }>(apiUrlRef.current, '/auth/refresh', {
        method: 'POST', body: JSON.stringify({ refreshToken: refreshRef.current }),
      }).then(({ accessToken }) => {
        accessRef.current = accessToken
        return accessToken
      }).finally(() => { refreshTaskRef.current = null })
    }
    return refreshTaskRef.current
  }, [])

  const retryRestore = useCallback(async () => {
    setStatus('loading')
    setBootError(null)
    try {
      const [storedUrl, storedRefresh] = await Promise.all([storage.get(API_URL_KEY), storage.get(REFRESH_KEY)])
      const nextUrl = storedUrl || DEFAULT_API_URL
      apiUrlRef.current = nextUrl
      setApiUrl(nextUrl)
      refreshRef.current = storedRefresh
      if (storedRefresh) {
        try {
          const accessToken = await refreshAccess()
          const me = await apiFetch<MeResult>(nextUrl, '/auth/me', {}, accessToken)
          if (me.role !== 'SELLER') throw new ApiError('Este app é exclusivo para vendedores.', 403)
          setSession({ user: { id: me.id, name: me.name, email: me.email, role: me.role }, company: me.company })
        } catch (error) {
          if (error instanceof ApiError && [401, 403, 404].includes(error.status)) await clearSession()
          else throw error
        }
      }
      setStatus('ready')
    } catch {
      setBootError('Não foi possível recuperar a sessão. Confira sua conexão e tente novamente.')
      setStatus('error')
    }
  }, [clearSession, refreshAccess])

  useEffect(() => { void retryRestore() }, [retryRestore])

  const login = useCallback(async ({ companySlug, email, password, apiUrl: enteredUrl }: Parameters<AuthContextValue['login']>[0]) => {
    const nextUrl = normalizeApiUrl(enteredUrl)
    const result = await apiFetch<LoginResult>(nextUrl, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ companySlug: companySlug.trim().toLowerCase(), email: email.trim().toLowerCase(), password }),
    })
    if (result.user.role !== 'SELLER') throw new Error('Este aplicativo é para vendedores. O dono usa o app desktop.')
    await Promise.all([storage.set(API_URL_KEY, nextUrl), storage.set(REFRESH_KEY, result.refreshToken)])
    apiUrlRef.current = nextUrl
    accessRef.current = result.accessToken
    refreshRef.current = result.refreshToken
    setApiUrl(nextUrl)
    setSession({ user: result.user, company: result.company })
  }, [])

  const logout = useCallback(async () => { await clearSession() }, [clearSession])

  const request = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const access = accessRef.current
    if (!access) throw new ApiError('Entre novamente para continuar.', 401)
    try {
      return await apiFetch<T>(apiUrlRef.current, path, init, access)
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error
      if (path === '/users/me/password' && error.serverMessage === 'Current password is incorrect') {
        throw new Error('Senha atual incorreta.')
      }
      try {
        const newAccess = await refreshAccess()
        return await apiFetch<T>(apiUrlRef.current, path, init, newAccess)
      } catch (refreshError) {
        if (path === '/users/me/password' && refreshError instanceof ApiError && refreshError.serverMessage === 'Current password is incorrect') {
          throw new Error('Senha atual incorreta.')
        }
        if (refreshError instanceof ApiError && refreshError.status === 401) await clearSession()
        throw refreshError
      }
    }
  }, [clearSession, refreshAccess])

  return <AuthContext.Provider value={{ status, bootError, session, apiUrl, login, logout, retryRestore, request }}>
    {children}
  </AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider is required')
  return context
}
