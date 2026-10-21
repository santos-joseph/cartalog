import { createHmac } from 'node:crypto'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { FastifyRequest } from 'fastify'
import { prisma } from '../../database/prisma'
import { env } from '../../config/env'
import { ForbiddenError, UnauthorizedError } from '../../shared/errors/app-error'

const platformSecret = createHmac('sha256', env.JWT_SECRET).update('cartalog-platform-v1').digest('hex')

export function issuePlatformToken(user: { id: string; role: string }) {
  return jwt.sign({ sub: user.id, role: user.role, scope: 'platform' }, platformSecret, {
    algorithm: 'HS256', issuer: 'cartalog', audience: 'cartalog-platform', expiresIn: '8h',
  })
}

export async function platformLogin(email: string, password: string) {
  const user = await prisma.platformUser.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new UnauthorizedError('E-mail ou senha inválidos')
  }
  return { accessToken: issuePlatformToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } }
}

export async function platformAuth(request: FastifyRequest) {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/i)?.[1]
  if (!token) throw new UnauthorizedError('Acesso global não autorizado')
  let payload: jwt.JwtPayload
  try {
    const verified = jwt.verify(token, platformSecret, { algorithms: ['HS256'], issuer: 'cartalog', audience: 'cartalog-platform' })
    if (typeof verified === 'string' || verified.scope !== 'platform' || !verified.sub) throw new Error('Invalid scope')
    payload = verified
  } catch { throw new UnauthorizedError('Sessão global inválida ou expirada') }
  const user = await prisma.platformUser.findUnique({ where: { id: payload.sub! }, select: { id: true, name: true, email: true, role: true, isActive: true } })
  if (!user || !user.isActive || user.role !== payload.role) throw new UnauthorizedError('Conta global indisponível')
  request.platformUser = { id: user.id, name: user.name, email: user.email, role: user.role }
}

export function requirePlatformOwner(request: FastifyRequest) {
  if (request.platformUser.role !== 'PLATFORM_OWNER') throw new ForbiddenError('Apenas o dono da plataforma pode alterar administradores')
}
