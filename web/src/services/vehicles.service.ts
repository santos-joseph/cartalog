import { api } from '@/lib/axios'

export const vehiclesService = {
  list: (params?: Record<string, unknown>) => api.get('/vehicles', { params }),
  findById: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: FormData | Record<string, unknown>) => api.post('/vehicles', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
  uploadImages: (id: string, files: FormData) =>
    api.post(`/vehicles/${id}/images`, files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (id: string, imageId: string) => api.delete(`/vehicles/${id}/images/${imageId}`),
  setCover: (id: string, file: FormData) =>
    api.patch(`/vehicles/${id}/cover`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getBrands: () => api.get('/vehicles/brands'),
  getModels: (brandId?: string) => api.get('/vehicles/models', { params: { brandId } }),
  getFeatures: () => api.get('/vehicles/features'),
}
