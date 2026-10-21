import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { registerSchema } from '../modules/auth/auth.schema'
import { authService } from '../modules/auth/auth.service'
import { prisma } from '../database/prisma'

function readPassword(): Promise<string> {
  stdout.write('Senha temporária (mín. 8, maiúscula e número): ')
  stdin.resume()
  stdin.setRawMode(true)
  return new Promise((resolve, reject) => {
    let value = ''
    const onData = (chunk: Buffer) => {
      for (const char of chunk.toString()) {
        if (char === '\r' || char === '\n') {
          stdin.off('data', onData)
          stdin.setRawMode(false)
          stdin.pause()
          stdout.write('\n')
          resolve(value)
          return
        }
        if (char === '\u0003') {
          stdin.off('data', onData)
          stdin.setRawMode(false)
          stdin.pause()
          stdout.write('\n')
          reject(new Error('Cancelado.'))
          return
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1)
        else value += char
      }
    }
    stdin.on('data', onData)
  })
}

async function main() {
  if (!stdin.isTTY) throw new Error('Execute este comando em um terminal interativo.')
  const rl = createInterface({ input: stdin, output: stdout })
  try {
    console.log('Criação interna de loja e conta do dono')
    const companyName = await rl.question('Nome da loja: ')
    const companyEmail = await rl.question('E-mail da loja: ')
    const companyPhone = await rl.question('Telefone da loja (opcional): ')
    const userName = await rl.question('Nome do dono: ')
    const userEmail = await rl.question('E-mail do dono: ')
    rl.close()
    const password = await readPassword()
    const input = registerSchema.parse({ companyName, companyEmail, companyPhone: companyPhone || undefined, userName, userEmail, password })
    const result = await authService.register(input)
    console.log(`Loja criada: ${result.company.slug}. Conta do dono: ${result.user.email}`)
  } finally {
    rl.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
