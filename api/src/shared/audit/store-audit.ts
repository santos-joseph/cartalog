import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../../database/prisma'

type AuditAction = { action: string; resource: string; id?: string }

export function describeMutation(method: string, path: string, body?: unknown): AuditAction | null {
  const parts = path.split('/').filter(Boolean)
  if (parts[0] !== 'api' || parts[1] !== 'v1') return null
  const [root, section, id, extra] = parts.slice(2)
  if (root === 'companies') {
    if (section === 'settings') {
      if (id === 'maintenance') return { action: 'maintenance_updated', resource: 'store' }
      if (id === 'logo') return { action: 'logo_updated', resource: 'store' }
      return { action: 'store_settings_updated', resource: 'store' }
    }
    if (section === 'categories') return { action: `category_${method === 'POST' ? 'created' : method === 'DELETE' ? 'deleted' : 'updated'}`, resource: 'category', id }
    if (section === 'banners') return { action: extra === 'image' ? 'banner_image_uploaded' : `banner_${method === 'POST' ? 'created' : method === 'DELETE' ? 'deleted' : 'updated'}`, resource: 'banner', id }
    if (section === 'pages') return { action: id === 'images' ? 'page_image_uploaded' : `page_${method === 'POST' ? 'created' : method === 'DELETE' ? 'deleted' : 'updated'}`, resource: 'page', id: id === 'images' ? undefined : id }
  }
  if (root === 'vehicles') {
    if (id === 'images' && extra) return { action: 'vehicle_image_deleted', resource: 'vehicle', id: section }
    if (id === 'images') return { action: 'vehicle_images_uploaded', resource: 'vehicle', id: section }
    if (id === 'cover') return { action: 'vehicle_cover_updated', resource: 'vehicle', id: section }
    return { action: `vehicle_${method === 'POST' ? 'created' : method === 'DELETE' ? 'deleted' : 'updated'}`, resource: 'vehicle', id: section }
  }
  if (root === 'users') {
    if (section === 'me' && id === 'password') return { action: 'password_changed', resource: 'user' }
    return { action: id === 'reactivate' ? 'seller_reactivated' : `seller_${method === 'POST' ? 'created' : method === 'DELETE' ? 'deactivated' : 'updated'}`, resource: 'user', id: section }
  }
  if (root === 'leads') {
    if (section === 'statuses') return { action: `lead_status_${method === 'POST' ? 'created' : method === 'DELETE' ? 'deleted' : 'updated'}`, resource: 'lead_status', id }
    if (id === 'claim') return { action: 'lead_claimed', resource: 'lead', id: section }
    if (id === 'release') return { action: 'lead_released', resource: 'lead', id: section }
    if (id === 'interactions') return { action: 'lead_interaction_added', resource: 'lead', id: section }
    if (section === 'public') return null
    if (method === 'PATCH' && body && typeof body === 'object') {
      if ('statusId' in body) return { action: 'lead_status_changed', resource: 'lead', id: section }
      if ('assignedUserId' in body) return { action: 'lead_assignment_updated', resource: 'lead', id: section }
    }
    return { action: `lead_${method === 'POST' ? 'created' : 'updated'}`, resource: 'lead', id: section }
  }
  return null
}

export async function writeStoreAudit(input: {
  companyId: string
  actorId?: string
  actorName: string
  actorEmail?: string
  action: string
  target: string
  details?: { method?: string; path?: string }
}) {
  await prisma.storeAuditLog.create({ data: input })
}

export async function auditStoreResponse(request: FastifyRequest, reply: FastifyReply, payload: unknown) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || reply.statusCode < 200 || reply.statusCode >= 300) return payload
  const actor = request.user
  if (!actor?.companyId || !actor.sub || !actor.name) return payload
  const path = new URL(request.url, 'http://localhost').pathname
  const event = describeMutation(request.method, path, request.body)
  if (!event) return payload

  let createdId: string | undefined
  if (request.method === 'POST' && typeof payload === 'string' && payload.length < 100_000) {
    try {
      const data = JSON.parse(payload) as { id?: unknown }
      if (typeof data.id === 'string') createdId = data.id
    } catch { /* Some successful responses have no JSON body. */ }
  }

  try {
    await writeStoreAudit({
      companyId: actor.companyId,
      actorId: actor.sub,
      actorName: actor.name,
      actorEmail: actor.email,
      action: event.action,
      target: `${event.resource}:${event.id || createdId || actor.companyId}`,
      details: { method: request.method, path },
    })
  } catch (error) {
    request.log.error({ err: error, action: event.action }, 'Failed to save store audit event')
  }
  return payload
}
