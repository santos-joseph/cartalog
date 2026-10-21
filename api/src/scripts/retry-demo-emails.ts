import 'dotenv/config'
import { prisma } from '../database/prisma'
import { sendDemoRequestEmail } from '../modules/demo/demo.service'

async function main() {
  const requests = await prisma.demoRequest.findMany({
    where: { emailStatus: { in: ['pending', 'failed'] } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  let sent = 0
  for (const request of requests) {
    try {
      await sendDemoRequestEmail(request)
      await prisma.demoRequest.update({ where: { id: request.id }, data: { emailStatus: 'sent', emailedAt: new Date() } })
      sent++
    } catch (error) {
      console.error(`Falha no pedido ${request.id}: ${error instanceof Error ? error.message : 'erro desconhecido'}`)
    }
  }
  console.log(`${sent}/${requests.length} pedidos enviados.`)
}

main().finally(() => prisma.$disconnect())
