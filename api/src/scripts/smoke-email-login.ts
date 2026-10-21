import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../database/prisma'

const origin = process.env.SMOKE_API_URL || 'http://127.0.0.1:3334'

async function post(path: string, email: string, password: string) {
  const response = await fetch(`${origin}/api/v1${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }),
  })
  return { status: response.status, body: await response.json() as { accessToken: string; scope?: string; user: { role: string }; company: { slug: string } } }
}

async function main() {
  const company = await prisma.company.findFirst({ select: { id: true, slug: true } })
  assert.ok(company, 'Crie uma empresa antes de executar o smoke test')
  const suffix = randomUUID().slice(0, 8)
  const email = `smoke-${suffix}@example.invalid`
  const platformEmail = `smoke-platform-${suffix}@example.invalid`
  const password = `Smoke${randomUUID()}A1`
  const passwordHash = await bcrypt.hash(password, 12)
  let userId: string | null = null
  let platformUserId: string | null = null
  try {
    userId = (await prisma.user.create({ data: { companyId: company.id, name: 'Smoke Owner', email, passwordHash, role: 'OWNER' } })).id
    platformUserId = (await prisma.platformUser.create({ data: { name: 'Smoke Platform', email: platformEmail, passwordHash, role: 'PLATFORM_ADMIN' } })).id

    const store = await post('/auth/login', email, password)
    assert.equal(store.status, 200)
    assert.equal(store.body.user.role, 'OWNER')
    assert.equal(store.body.company.slug, company.slug)

    const desktopStore = await post('/auth/desktop-login', email, password)
    assert.equal(desktopStore.status, 200)
    assert.equal(desktopStore.body.scope, 'company')
    assert.equal(desktopStore.body.user.role, 'OWNER')

    const desktopPlatform = await post('/auth/desktop-login', platformEmail, password)
    assert.equal(desktopPlatform.status, 200)
    assert.equal(desktopPlatform.body.scope, 'platform')
    assert.equal(desktopPlatform.body.user.role, 'PLATFORM_ADMIN')
    const me = await fetch(`${origin}/api/v1/platform/me`, { headers: { Authorization: `Bearer ${desktopPlatform.body.accessToken}` } })
    assert.equal(me.status, 200)

    const wrongPassword = await post('/auth/login', email, 'senha-incorreta')
    assert.equal(wrongPassword.status, 401)
    console.log('Login por e-mail de loja e plataforma: OK')
  } finally {
    if (userId) await prisma.user.delete({ where: { id: userId } })
    if (platformUserId) await prisma.platformUser.delete({ where: { id: platformUserId } })
    await prisma.$disconnect()
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
