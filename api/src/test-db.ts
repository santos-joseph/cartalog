import 'dotenv/config'
import { prisma } from './database/prisma'

async function main() {
  console.log('--- DATABASE DIAGNOSIS ---')
  const companies = await prisma.company.findMany()
  console.log('Companies:')
  for (const c of companies) {
    console.log(`- ${c.name} (id: ${c.id}, slug: ${c.slug})`)
  }

  const statuses = await prisma.leadStatus.findMany()
  console.log('\nLead Statuses:')
  for (const s of statuses) {
    console.log(`- [${s.name}] (id: ${s.id}, companyId: ${s.companyId})`)
  }

  const leads = await prisma.lead.findMany({
    include: { status: true }
  })
  console.log('\nLeads:')
  for (const l of leads) {
    console.log(`- Lead: ${l.name} (id: ${l.id}, companyId: ${l.companyId}, statusId: ${l.statusId}, statusName: ${l.status?.name})`)
  }

  const users = await prisma.user.findMany()
  console.log('\nUsers:')
  for (const u of users) {
    console.log(`- User: ${u.name} (email: ${u.email}, role: ${u.role}, companyId: ${u.companyId})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
