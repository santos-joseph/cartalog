import { api } from '@/lib/axios'

export const leadsService = {
  list: (params?: Record<string, unknown>) => api.get('/leads', { params }),
  stats: () => api.get('/leads/stats'),
  findById: (id: string) => api.get(`/leads/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/leads/${id}`, data),
  addInteraction: (id: string, data: { type: string; description: string }) =>
    api.post(`/leads/${id}/interactions`, data),
}
