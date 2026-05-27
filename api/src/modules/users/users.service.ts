import bcrypt from 'bcryptjs'
import { prisma } from '../../database/prisma'
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors/app-error'
import type { CreateUserInput, UpdateUserInput, ChangePasswordInput } from './users.schema'

export class UsersService {
  async list(companyId: string) {
    return prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findById(companyId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!user) throw new NotFoundError('User')
    return user
  }

  async create(companyId: string, input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { companyId_email: { companyId, email: input.email } },
    })
    if (existing) throw new ConflictError(`User with email "${input.email}"`)

    const passwordHash = await bcrypt.hash(input.password, 12)

    return prisma.user.create({
      data: { companyId, ...input, passwordHash, password: undefined },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    })
  }

  async update(companyId: string, userId: string, requestorId: string, requestorRole: string, input: UpdateUserInput) {
    const user = await this.findUserOrThrow(companyId, userId)

    // Só ADMIN pode mudar o role de outros ADMIN
    if (user.role === 'ADMIN' && requestorId !== userId && requestorRole !== 'ADMIN') {
      throw new ForbiddenError('Only admins can modify other admin accounts')
    }

    return prisma.user.update({
      where: { id: userId },
      data: input,
      select: { id: true, name: true, email: true, role: true, active: true, updatedAt: true },
    })
  }

  async changePassword(companyId: string, userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } })
    if (!user) throw new NotFoundError('User')

    const match = await bcrypt.compare(input.currentPassword, user.passwordHash)
    if (!match) throw new UnauthorizedError('Current password is incorrect')

    const newHash = await bcrypt.hash(input.newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } })

    return { message: 'Password updated successfully' }
  }

  async delete(companyId: string, userId: string, requestorId: string) {
    if (userId === requestorId) {
      throw new ForbiddenError('You cannot delete your own account')
    }

    await this.findUserOrThrow(companyId, userId)
    await prisma.user.delete({ where: { id: userId } })
  }

  private async findUserOrThrow(companyId: string, userId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } })
    if (!user) throw new NotFoundError('User')
    return user
  }
}

export const usersService = new UsersService()
