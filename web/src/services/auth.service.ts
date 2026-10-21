import { api } from '@/lib/axios'

interface LoginPayload {
  companySlug: string
  email: string
  password: string
}

export const authService = {
  login: (data: LoginPayload) => api.post('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
}
