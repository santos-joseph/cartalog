import { api } from '@/lib/axios'

interface RegisterPayload {
  companyName: string
  companyEmail: string
  companyPhone?: string
  userName: string
  userEmail: string
  password: string
}

interface LoginPayload {
  companySlug: string
  email: string
  password: string
}

export const authService = {
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  login: (data: LoginPayload) => api.post('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
}
