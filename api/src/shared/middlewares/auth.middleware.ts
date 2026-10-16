import { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '../errors/app-error'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    throw new UnauthorizedError('Missing or invalid token')
  }
}

export function requireRole(...roles: string[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply) {
    await request.jwtVerify()
    if (!roles.includes(request.user.role)) {
      throw new UnauthorizedError('Insufficient permissions')
    }
  }
}
