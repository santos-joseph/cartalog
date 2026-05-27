import bcrypt from 'bcryptjs'
import { prisma } from '../../database/prisma'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt'
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/app-error'
import { slugify } from '../../shared/utils/slug'
import type { LoginInput, RefreshInput, RegisterInput } from './auth.schema'

export class AuthService {
  async register(input: RegisterInput) {
    const slug = slugify(input.companyName)

    const [existingSlug, existingEmail] = await Promise.all([
      prisma.company.findUnique({ where: { slug } }),
      prisma.company.findFirst({ where: { email: input.companyEmail } }),
    ])

    if (existingSlug) throw new ConflictError(`Company slug "${slug}"`)
    if (existingEmail) throw new ConflictError('Company email')

    const passwordHash = await bcrypt.hash(input.password, 12)

    const { company, user } = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.companyName,
          slug,
          email: input.companyEmail,
          phone: input.companyPhone,
        },
      })

      await tx.siteSettings.create({ data: { companyId: company.id } })
      await tx.seoSettings.create({ data: { companyId: company.id } })

      const user = await tx.user.create({
        data: {
          companyId: company.id,
          name: input.userName,
          email: input.userEmail,
          passwordHash,
          role: 'ADMIN',
        },
      })

      return { company, user }
    })

    const accessToken = generateAccessToken({ sub: user.id, companyId: company.id, role: user.role })
    const refreshToken = generateRefreshToken(user.id)

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: company.id, name: company.name, slug: company.slug },
    }
  }

  async login(input: LoginInput) {
    const company = await prisma.company.findUnique({ where: { slug: input.companySlug } })

    if (!company) {
      throw new UnauthorizedError('Invalid credentials')
    }

    const user = await prisma.user.findUnique({
      where: { companyId_email: { companyId: company.id, email: input.email } },
    })

    if (!user) {
      throw new UnauthorizedError('Invalid credentials')
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash)
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid credentials')
    }

    const accessToken = generateAccessToken({ sub: user.id, companyId: company.id, role: user.role })
    const refreshToken = generateRefreshToken(user.id)

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: company.id, name: company.name, slug: company.slug },
    }
  }

  async refresh(input: RefreshInput) {
    try {
      const payload = verifyRefreshToken(input.refreshToken)

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { company: { select: { id: true } } },
      })

      if (!user) {
        throw new UnauthorizedError('Invalid refresh token')
      }

      const accessToken = generateAccessToken({
        sub: user.id,
        companyId: user.companyId,
        role: user.role,
      })

      return { accessToken }
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err
      throw new UnauthorizedError('Invalid or expired refresh token')
    }
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: { include: { siteSettings: true } },
      },
    })

    if (!user) throw new NotFoundError('User')

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        primaryColor: user.company.primaryColor,
        logoUrl: user.company.logoUrl,
        showPrices: user.company.siteSettings?.showPrices ?? true,
      },
    }
  }
}

export const authService = new AuthService()
