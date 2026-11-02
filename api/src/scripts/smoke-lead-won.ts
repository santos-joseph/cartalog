import 'dotenv/config'
import assert from 'node:assert/strict'
import { prisma } from '../database/prisma'
import { generateAccessToken } from '../shared/utils/jwt'

async function main() {
  const seller = await prisma.user.findFirst({ where: { role: 'SELLER', isActive: true }, select: { id: true, companyId: true } })
  assert.ok(seller, 'Cadastre um vendedor para executar o teste')
  const open = await prisma.leadStatus.findFirst({ where: { companyId: seller.companyId, kind: 'open' }, select: { id: true } })
  const won = await prisma.leadStatus.findFirst({ where: { companyId: seller.companyId, kind: 'won' }, select: { id: true } })
  assert.ok(seller && open && won, 'Vendedor ou status de teste não encontrado')

  const lead = await prisma.lead.create({
    data: { companyId: seller.companyId, assignedUserId: seller.id, statusId: open.id, name: 'Teste automático de status final' },
  })
  try {
    const token = generateAccessToken({ sub: seller.id, companyId: seller.companyId, role: 'SELLER' })
    const response = await fetch(`http://127.0.0.1:3333/api/v1/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusId: won.id }),
    })
    const body = await response.json() as { status?: { kind?: string }; error?: string }
    assert.equal(response.status, 200, body.error ?? 'PATCH não retornou 200')
    assert.equal(body.status?.kind, 'won', 'Resposta não retornou status final')
    const saved = await prisma.lead.findUnique({ where: { id: lead.id }, select: { statusId: true } })
    assert.equal(saved?.statusId, won.id, 'Status final não persistiu')
    console.log('Status final salvo com sucesso pela API (PATCH 200).')
  } finally {
    await prisma.lead.delete({ where: { id: lead.id } })
    await prisma.storeAuditLog.deleteMany({ where: { companyId: seller.companyId, target: `lead:${lead.id}` } })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
