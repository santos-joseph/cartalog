import bcrypt from 'bcryptjs'
import { prisma } from '../../database/prisma'
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors/app-error'
import type { CreateUserInput, UpdateUserInput, ChangePasswordInput } from './users.schema'

export class UsersService {
  async list(companyId: string, includeInactive = false) {
    return prisma.user.findMany({
      where: { companyId, ...(includeInactive ? {} : { isActive: true }) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async findById(companyId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })
    if (!user) throw new NotFoundError('User')
    return user
  }

  async create(companyId: string, input: CreateUserInput) {
    const email = input.email.trim().toLowerCase()
    const [existing, platformUser] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.platformUser.findUnique({ where: { email } }),
    ])
    if (existing || platformUser) throw new ConflictError('Este e-mail já pertence a outra conta')

    const passwordHash = await bcrypt.hash(input.password, 12)

    return prisma.user.create({
      data: { companyId, name: input.name, email, role: input.role, passwordHash },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
  }

  async update(companyId: string, userId: string, requestorId: string, requestorRole: string, input: UpdateUserInput) {
    const user = await this.findUserOrThrow(companyId, userId)

    if (user.role === 'OWNER') throw new ForbiddenError('The owner account cannot be changed here')

    return prisma.user.update({
      where: { id: userId },
      data: { name: input.name },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
  }

  async changePassword(companyId: string, userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId, isActive: true } })
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

    const user = await this.findUserOrThrow(companyId, userId)
    if (user.role === 'OWNER') throw new ForbiddenError('The owner account cannot be removed')
    await prisma.$transaction(async (tx) => {
      await tx.lead.updateMany({ where: { companyId, assignedUserId: userId }, data: { assignedUserId: null } })
      await tx.user.update({ where: { id: userId }, data: { isActive: false } })
    })
  }

  async reactivate(companyId: string, userId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } })
    if (!user) throw new NotFoundError('User')
    if (user.role !== 'SELLER') throw new ForbiddenError('Only sellers can be reactivated here')
    return prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
  }

  private async findUserOrThrow(companyId: string, userId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, companyId, isActive: true } })
    if (!user) throw new NotFoundError('User')
    return user
  }
}

export const usersService = new UsersService()
