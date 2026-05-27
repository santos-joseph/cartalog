import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from './app-error'

export function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ZodError) {
    return reply.status(422).send({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.flatten().fieldErrors,
    })
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    })
  }

  // Prisma known errors
  if (error.name === 'PrismaClientKnownRequestError') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaError = error as any
    if (prismaError.code === 'P2002') {
      return reply.status(409).send({ error: 'A record with this data already exists', code: 'CONFLICT' })
    }
    if (prismaError.code === 'P2025') {
      return reply.status(404).send({ error: 'Record not found', code: 'NOT_FOUND' })
    }
  }

  // Fastify validation errors
  if ('statusCode' in error && (error as FastifyError).statusCode === 400) {
    return reply.status(400).send({ error: error.message, code: 'BAD_REQUEST' })
  }

  request.log.error(error)

  return reply.status(500).send({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  })
}
