import { api } from '@/lib/axios'

export const companiesService = {
  // Settings
  getSettings: () => api.get('/companies/settings'),
  updateSettings: (data: Record<string, unknown>) => api.put('/companies/settings', data),
  uploadLogo: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/companies/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  // Categories
  getCategories: () => api.get('/companies/categories'),
  createCategory: (name: string) => api.post('/companies/categories', { name }),
  updateCategory: (id: string, name: string) => api.put(`/companies/categories/${id}`, { name }),
  deleteCategory: (id: string) => api.delete(`/companies/categories/${id}`),

  // Banners
  getBanners: () => api.get('/companies/banners'),
  createBanner: (data: Record<string, unknown>) => api.post('/companies/banners', data),
  updateBanner: (id: string, data: Record<string, unknown>) => api.put(`/companies/banners/${id}`, data),
  uploadBannerImage: (id: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/companies/banners/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteBanner: (id: string) => api.delete(`/companies/banners/${id}`),

  // Pages
  getPages: () => api.get('/companies/pages'),
  createPage: (data: Record<string, unknown>) => api.post('/companies/pages', data),
  updatePage: (id: string, data: Record<string, unknown>) => api.put(`/companies/pages/${id}`, data),
  deletePage: (id: string) => api.delete(`/companies/pages/${id}`),
}
