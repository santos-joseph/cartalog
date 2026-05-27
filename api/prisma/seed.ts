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

  // ---- Brands & Models ----
  const brandData = [
    { name: 'Toyota', models: ['Corolla', 'Hilux', 'Yaris', 'RAV4'] },
    { name: 'Honda', models: ['Civic', 'HR-V', 'Fit', 'CR-V'] },
    { name: 'Chevrolet', models: ['Onix', 'Tracker', 'S10', 'Cruze'] },
    { name: 'Volkswagen', models: ['Gol', 'Polo', 'T-Cross', 'Tiguan'] },
    { name: 'Ford', models: ['Ka', 'EcoSport', 'Ranger', 'Territory'] },
    { name: 'Hyundai', models: ['HB20', 'Creta', 'Tucson', 'ix35'] },
    { name: 'Fiat', models: ['Argo', 'Cronos', 'Toro', 'Pulse'] },
    { name: 'Jeep', models: ['Renegade', 'Compass', 'Commander'] },
  ]

  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: { name: b.name },
      update: {},
      create: { name: b.name },
    })
    for (const modelName of b.models) {
      await prisma.model.upsert({
        where: { brandId_name: { brandId: brand.id, name: modelName } },
        update: {},
        create: { brandId: brand.id, name: modelName },
      })
    }
  }
  console.log(`✅  ${brandData.length} brands + models`)

  // ---- Fuels ----
  const fuels = ['Flex', 'Gasolina', 'Etanol', 'Diesel', 'Elétrico', 'Híbrido']
  for (const name of fuels) {
    await prisma.fuel.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log(`✅  ${fuels.length} fuels`)

  // ---- Transmissions ----
  const transmissions = ['Manual', 'Automático', 'CVT', 'Semi-automático']
  for (const name of transmissions) {
    await prisma.transmission.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log(`✅  ${transmissions.length} transmissions`)

  // ---- Features ----
  const features = [
    'Ar condicionado', 'Direção elétrica', 'Vidros elétricos', 'Trava elétrica',
    'Câmera de ré', 'Sensor de estacionamento', 'Airbag', 'Freios ABS',
    'Controle de estabilidade', 'Central multimídia', 'Bluetooth', 'GPS',
    'Bancos em couro', 'Teto solar', 'Rodas de liga leve', 'Faróis de neblina',
  ]
  for (const name of features) {
    await prisma.feature.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log(`✅  ${features.length} features`)

  // ---- Demo Company ----
  const company = await prisma.company.upsert({
    where: { slug: 'demo-motors' },
    update: {},
    create: {
      name: 'Demo Motors',
      slug: 'demo-motors',
      email: 'contato@demo-motors.com.br',
      phone: '(11) 99999-9999',
      whatsapp: '5511999999999',
      primaryColor: '#2563EB',
      secondaryColor: '#1E40AF',
      description: 'Os melhores veículos da região',
    },
  })

  // Settings for demo company
  await prisma.siteSettings.upsert({
    where: { companyId: company.id },
    update: {},
    create: { companyId: company.id, showPrices: true, showWhatsappButton: true },
  })

  await prisma.seoSettings.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      metaTitle: 'Demo Motors — Os melhores veículos da região',
      metaDescription: 'Encontre seu próximo veículo com a Demo Motors.',
    },
  })

  await prisma.companyLocation.create({
    data: { companyId: company.id, city: 'São Paulo', state: 'SP', address: 'Av. Paulista, 1000' },
  }).catch(() => null)

  // Lead statuses for demo company (idempotent)
  const statusNames = ['Novo', 'Contactado', 'Negociando', 'Ganho', 'Perdido']
  const existingStatuses = await prisma.leadStatus.findMany({ where: { companyId: company.id } })
  if (existingStatuses.length === 0) {
    for (let i = 0; i < statusNames.length; i++) {
      await prisma.leadStatus.create({
        data: { companyId: company.id, name: statusNames[i], position: i + 1 },
      })
    }
  }

  // Categories for demo company
  const categoryNames = ['Carros', 'SUVs', 'Pickups', 'Motos', 'Caminhões']
  for (const name of categoryNames) {
    const slug = name.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[̀-ͯ]/g, '')
    await prisma.category.upsert({
      where: { companyId_slug: { companyId: company.id, slug } },
      update: {},
      create: { companyId: company.id, name, slug },
    }).catch(() => null)
  }

  // Admin user
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
  console.log(`   Email: admin@demo.com | Senha: Admin@123`)
  console.log('\n🎉  Seed concluído!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
