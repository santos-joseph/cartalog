'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '@/types'

interface AuthStore {
  user: User | null
  company: Company | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (data: { user: User; company: Company; accessToken: string; refreshToken: string }) => void
  updateTokens: (accessToken: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      accessToken: null,
      refreshToken: null,

      setAuth({ user, company, accessToken, refreshToken }) {
        localStorage.setItem('@cartalog:token', accessToken)
        localStorage.setItem('@cartalog:refreshToken', refreshToken)
        set({ user, company, accessToken, refreshToken })
      },

      updateTokens(accessToken) {
        localStorage.setItem('@cartalog:token', accessToken)
        set({ accessToken })
      },

      logout() {
        localStorage.removeItem('@cartalog:token')
        localStorage.removeItem('@cartalog:refreshToken')
        set({ user: null, company: null, accessToken: null, refreshToken: null })
      },

      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    {
      name: '@cartalog:auth',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
