import { api } from '@/lib/axios'

export const leadsService = {
  list: (params?: Record<string, unknown>) => api.get('/leads', { params }),
  stats: () => api.get('/leads/stats'),
  statuses: () => api.get('/leads/statuses'),
  findById: (id: string) => api.get(`/leads/${id}`),
  update: (id: string, data: { statusId?: string; assignedUserId?: string }) =>
    api.patch(`/leads/${id}`, data),
  addInteraction: (id: string, data: { type: string; note?: string }) =>
    api.post(`/leads/${id}/interactions`, data),
}
