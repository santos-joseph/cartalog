import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../database/prisma'

function readPassword(): Promise<string> {
  stdout.write('Senha (mín. 8 caracteres, maiúscula e número): ')
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
  if (!stdin.isTTY) throw new Error('Execute em um terminal interativo.')
  const rl = createInterface({ input: stdin, output: stdout })
  stdout.write('Conta principal da plataforma Cartalog\n')
  const name = await rl.question('Nome: ')
  const email = await rl.question('E-mail: ')
  rl.close()
  const password = await readPassword()
  const input = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email().transform((value) => value.toLowerCase()),
    password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  }).parse({ name, email, password })
  const existingEmail = await prisma.platformUser.findUnique({ where: { email: input.email } })
  const existingStoreUser = await prisma.user.findUnique({ where: { email: input.email } })
  const owner = await prisma.platformUser.findFirst({ where: { role: 'PLATFORM_OWNER' } })
  if (existingStoreUser) throw new Error('Este e-mail já pertence a uma conta de loja.')
  if (existingEmail && existingEmail.id !== owner?.id) throw new Error('Este e-mail já pertence a outro administrador global.')
  const passwordHash = await bcrypt.hash(input.password, 12)
  const user = owner
    ? await prisma.platformUser.update({ where: { id: owner.id }, data: { name: input.name, email: input.email, passwordHash, isActive: true } })
    : await prisma.platformUser.create({ data: { name: input.name, email: input.email, passwordHash, role: 'PLATFORM_OWNER' } })
  stdout.write(`Administrador global configurado: ${user.email}\n`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
