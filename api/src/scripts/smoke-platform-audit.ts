import 'dotenv/config'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import { requirePlatformOwner } from '../modules/platform/platform.auth'
import { describeMutation } from '../shared/audit/store-audit'

async function main() {
  const app = Fastify()
  app.get('/owner-only', { onRequest: [async (request) => {
    request.platformUser = { id: 'test', name: 'Test', email: 'test@example.invalid', role: request.headers['x-role'] === 'owner' ? 'PLATFORM_OWNER' : 'PLATFORM_ADMIN' }
  }, requirePlatformOwner] }, async () => ({ ok: true }))
  try {
    const owner = await Promise.race([
      app.inject({ method: 'GET', url: '/owner-only', headers: { 'x-role': 'owner' } }),
      new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('Owner hook did not complete')), 2000)),
    ])
    assert.equal(owner.statusCode, 200)
    const admin = await app.inject({ method: 'GET', url: '/owner-only' })
    assert.equal(admin.statusCode, 403)

    for (const [method, path, action] of [
      ['POST', '/api/v1/vehicles', 'vehicle_created'],
      ['DELETE', '/api/v1/vehicles/vehicle-id/images/image-id', 'vehicle_image_deleted'],
      ['PATCH', '/api/v1/companies/settings/maintenance', 'maintenance_updated'],
      ['POST', '/api/v1/leads/lead-id/claim', 'lead_claimed'],
      ['POST', '/api/v1/leads/lead-id/interactions', 'lead_interaction_added'],
      ['PATCH', '/api/v1/users/user-id/reactivate', 'seller_reactivated'],
      ['DELETE', '/api/v1/companies/pages/page-id', 'page_deleted'],
    ]) assert.equal(describeMutation(method, path)?.action, action, path)
    assert.equal(describeMutation('PATCH', '/api/v1/leads/lead-id', { statusId: 'status-id' })?.action, 'lead_status_changed')
    assert.equal(describeMutation('PATCH', '/api/v1/leads/lead-id', { assignedUserId: 'seller-id' })?.action, 'lead_assignment_updated')
    console.log('Owner access and store audit routes: OK')
  } finally { await app.close() }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
