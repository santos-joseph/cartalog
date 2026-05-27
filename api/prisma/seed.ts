import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱  Seeding database...')

  // ---- Brands ----
  const brandNames = ['Toyota', 'Honda', 'Chevrolet', 'Volkswagen', 'Ford', 'Hyundai', 'Fiat', 'Jeep', 'Nissan', 'Renault']
  const brands = await Promise.all(
    brandNames.map((name) =>
      prisma.brand.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  )
  console.log(`✅  ${brands.length} brands`)

  // Models for Toyota
  const toyota = brands.find((b) => b.name === 'Toyota')!
  await Promise.all([
    prisma.vehicleModel.upsert({ where: { brandId_name: { brandId: toyota.id, name: 'Corolla' } }, update: {}, create: { brandId: toyota.id, name: 'Corolla' } }),
    prisma.vehicleModel.upsert({ where: { brandId_name: { brandId: toyota.id, name: 'Hilux' } }, update: {}, create: { brandId: toyota.id, name: 'Hilux' } }),
    prisma.vehicleModel.upsert({ where: { brandId_name: { brandId: toyota.id, name: 'Yaris' } }, update: {}, create: { brandId: toyota.id, name: 'Yaris' } }),
  ])

  // Models for Honda
  const honda = brands.find((b) => b.name === 'Honda')!
  await Promise.all([
    prisma.vehicleModel.upsert({ where: { brandId_name: { brandId: honda.id, name: 'Civic' } }, update: {}, create: { brandId: honda.id, name: 'Civic' } }),
    prisma.vehicleModel.upsert({ where: { brandId_name: { brandId: honda.id, name: 'HR-V' } }, update: {}, create: { brandId: honda.id, name: 'HR-V' } }),
    prisma.vehicleModel.upsert({ where: { brandId_name: { brandId: honda.id, name: 'Fit' } }, update: {}, create: { brandId: honda.id, name: 'Fit' } }),
  ])

  // ---- Vehicle Features ----
  const featureData = [
    { name: 'Ar condicionado', category: 'Conforto' },
    { name: 'Direção elétrica', category: 'Conforto' },
    { name: 'Vidros elétricos', category: 'Conforto' },
    { name: 'Trava elétrica', category: 'Conforto' },
    { name: 'Banco elétrico', category: 'Conforto' },
    { name: 'Teto solar', category: 'Conforto' },
    { name: 'Câmera de ré', category: 'Segurança' },
    { name: 'Sensor de estacionamento', category: 'Segurança' },
    { name: 'Airbag', category: 'Segurança' },
    { name: 'Freios ABS', category: 'Segurança' },
    { name: 'Controle de estabilidade', category: 'Segurança' },
    { name: 'Central multimídia', category: 'Entretenimento' },
    { name: 'Bluetooth', category: 'Entretenimento' },
    { name: 'GPS', category: 'Entretenimento' },
    { name: 'Bancos em couro', category: 'Luxo' },
    { name: 'Rodas de liga leve', category: 'Estética' },
  ]

  const features = await Promise.all(
    featureData.map((f) =>
      prisma.vehicleFeature.upsert({ where: { name: f.name }, update: {}, create: f }),
    ),
  )
  console.log(`✅  ${features.length} vehicle features`)

  // ---- Demo Company ----
  const company = await prisma.company.upsert({
    where: { slug: 'demo-motors' },
    update: {},
    create: {
      name: 'Demo Motors',
      slug: 'demo-motors',
      email: 'contato@demo-motors.com.br',
      phone: '(11) 99999-9999',
      settings: {
        create: {
          siteTitle: 'Demo Motors — Os melhores veículos da região',
          siteDescription: 'Encontre seu próximo veículo com a Demo Motors. Qualidade e confiança.',
          primaryColor: '#2563EB',
          secondaryColor: '#1E40AF',
          whatsapp: '5511999999999',
          city: 'São Paulo',
          state: 'SP',
        },
      },
    },
  })

  const adminHash = await bcrypt.hash('Admin@123', 12)

  await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Administrador Demo',
      email: 'admin@demo.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  })

  console.log(`✅  Demo company: "${company.name}" (slug: ${company.slug})`)
  console.log(`   Admin email: admin@demo.com`)
  console.log(`   Admin password: Admin@123`)

  console.log('\n🎉  Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
