import { api } from '@/lib/axios'

export const dashboardService = {
  overview: () => api.get('/dashboard/overview'),
}
