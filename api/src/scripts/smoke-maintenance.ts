import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../database/prisma'
import { authService } from '../modules/auth/auth.service'
import { generateAccessToken } from '../shared/utils/jwt'

const base = process.env.SMOKE_API_URL || 'http://127.0.0.1:3333'

async function main() {
  const suffix = randomUUID().slice(0, 8)
  const owner = await authService.register({
    companyName: `Cartalog QA ${suffix}`,
    companyEmail: `qa-company-${suffix}@example.invalid`,
    userName: 'Dono QA',
    userEmail: `qa-owner-${suffix}@example.invalid`,
    password: `Qa-${suffix}-2026`,
  })
  const companyId = owner.company.id
  const tenantHeaders = { 'X-Tenant-Slug': owner.company.slug }
  const ownerHeaders = { Authorization: `Bearer ${owner.accessToken}`, 'Content-Type': 'application/json' }
  try {
    const seller = await prisma.user.create({ data: { companyId, name: 'Vendedor QA', email: `qa-seller-${suffix}@example.invalid`, passwordHash: await bcrypt.hash(randomUUID(), 10), role: 'SELLER' } })
    const sellerToken = generateAccessToken({ sub: seller.id, companyId, role: 'SELLER' })
    let response = await fetch(`${base}/api/v1/companies/settings/maintenance`, { method: 'PATCH', headers: { Authorization: `Bearer ${sellerToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: true }) })
    assert.equal(response.status, 401, 'vendedor não pode alterar manutenção')

    response = await fetch(`${base}/api/v1/companies/settings/maintenance`, { method: 'PATCH', headers: ownerHeaders, body: JSON.stringify({ enabled: true, message: 'Voltamos em breve.' }) })
    assert.equal(response.status, 200, 'dono pode ativar manutenção')
    assert.equal((await response.json() as { maintenanceEnabled: boolean }).maintenanceEnabled, true)

    response = await fetch(`${base}/api/v1/catalog/status`, { headers: tenantHeaders })
    assert.equal(response.status, 200)
    assert.equal((await response.json() as { maintenanceEnabled: boolean }).maintenanceEnabled, true)

    response = await fetch(`${base}/api/v1/catalog`, { headers: tenantHeaders })
    assert.equal(response.status, 503, 'catálogo fica indisponível')
    response = await fetch(`${base}/api/v1/leads/public`, { method: 'POST', headers: { ...tenantHeaders, 'Content-Type': 'application/json' }, body: '{}' })
    assert.equal(response.status, 503, 'captura pública de lead fica indisponível')

    response = await fetch(`${base}/api/v1/companies/settings/maintenance`, { method: 'PATCH', headers: ownerHeaders, body: JSON.stringify({ enabled: false }) })
    assert.equal(response.status, 200, 'dono pode reabrir o site')
    response = await fetch(`${base}/api/v1/catalog`, { headers: tenantHeaders })
    assert.equal(response.status, 200, 'catálogo volta ao ar')
    console.log('SMOKE_MAINTENANCE_OK')
  } finally {
    await prisma.siteMaintenanceEvent.deleteMany({ where: { companyId } })
    await prisma.user.deleteMany({ where: { companyId } })
    await prisma.leadStatus.deleteMany({ where: { companyId } })
    await prisma.seoSettings.deleteMany({ where: { companyId } })
    await prisma.siteSettings.deleteMany({ where: { companyId } })
    await prisma.company.delete({ where: { id: companyId } })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
