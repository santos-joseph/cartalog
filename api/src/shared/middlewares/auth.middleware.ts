import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../errors/app-error'
import { prisma } from '../../database/prisma'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError('Missing or invalid token')
  }
  const user = await prisma.user.findUnique({ where: { id: request.user.sub }, select: { id: true, companyId: true, role: true, isActive: true } })
  if (!user || !user.isActive || user.companyId !== request.user.companyId) throw new UnauthorizedError('Account no longer available')
  request.user = { sub: user.id, companyId: user.companyId, role: user.role }
}

export function requireRole(...roles: string[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    if (!roles.includes(request.user.role)) {
      throw new UnauthorizedError('Insufficient permissions')
    }
  }
}
