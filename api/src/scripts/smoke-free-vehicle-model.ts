import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { prisma } from '../database/prisma'
import { VehiclesService } from '../modules/vehicles/vehicles.service'
import { createVehicleSchema, updateVehicleSchema } from '../modules/vehicles/vehicles.schema'

async function main() {
  const company = await prisma.company.findFirst({ select: { id: true } })
  const brand = await prisma.brand.findFirst({ select: { id: true } })
  assert.ok(company && brand, 'O teste precisa de uma loja e uma marca cadastradas')
  const name = `Teste Modelo ${randomUUID().slice(0, 8)}`
  const service = new VehiclesService()
  let vehicleId: string | undefined
  let modelId: string | undefined

  try {
    const created = await service.create(company.id, createVehicleSchema.parse({
      brandId: brand.id, modelName: name, year: 2025, mileage: 0, price: 10000,
    }))
    vehicleId = created.id
    modelId = created.modelId
    assert.equal(created.model.name, name)

    const updated = await service.update(company.id, vehicleId, updateVehicleSchema.parse({
      brandId: brand.id, modelName: name.toLowerCase(), description: '**Descrição em Markdown**',
    }))
    assert.equal(updated.modelId, modelId, 'A edição duplicou o modelo existente')
    assert.equal(updated.description, '**Descrição em Markdown**')
    console.log('Modelo livre criado, reutilizado na edição e descrição Markdown salva.')
  } finally {
    if (vehicleId) await prisma.vehicle.delete({ where: { id: vehicleId } })
    if (modelId) await prisma.model.delete({ where: { id: modelId } })
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
