import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { Prisma } from '../../../generated/prisma/client'
import { prisma } from '../../database/prisma'
import { authService } from '../auth/auth.service'
import { registerSchema } from '../auth/auth.schema'
import { platformAuth, platformLogin, requirePlatformOwner } from './platform.auth'
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../shared/errors/app-error'

const uuid = z.uuid()
const password = z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
const loginSchema = z.object({ email: z.email().transform((value) => value.toLowerCase()), password: z.string().min(1) })
const adminSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.email().transform((value) => value.toLowerCase()), password })
const planSchema = z.object({ code: z.string().trim().regex(/^[a-z0-9-]{2,50}$/), name: z.string().trim().min(2).max(100), priceCents: z.number().int().min(0), billingInterval: z.enum(['monthly', 'yearly']), isActive: z.boolean().default(true) })
const subscriptionSchema = z.object({ planId: uuid, status: z.enum(['trialing', 'active', 'past_due', 'suspended', 'canceled']), currentPeriodEnd: z.iso.datetime().nullish(), notes: z.string().max(1000).nullish() })
const companySchema = registerSchema.extend({ planId: uuid.optional() })
const loginAttempts = new Map<string, { count: number; until: number }>()

async function audit(actorId: string, action: string, target: string, details?: Record<string, unknown>) {
  await prisma.platformAuditLog.create({ data: { actorId, action, target, details: details as Prisma.InputJsonValue | undefined } })
}

export async function platformRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request) => {
    const input = loginSchema.parse(request.body)
    const key = `${request.ip}:${input.email}`
    const current = loginAttempts.get(key)
    if (current && current.until > Date.now() && current.count >= 5) throw new UnauthorizedError('Aguarde 15 minutos antes de tentar novamente')
    try {
      const result = await platformLogin(input.email, input.password)
      loginAttempts.delete(key)
      return result
    } catch (error) {
      loginAttempts.set(key, { count: current && current.until > Date.now() ? current.count + 1 : 1, until: Date.now() + 15 * 60_000 })
      if (loginAttempts.size > 5000) for (const [attemptKey, attempt] of loginAttempts) if (attempt.until <= Date.now()) loginAttempts.delete(attemptKey)
      throw error
    }
  })

  app.register(async (privateApp) => {
    privateApp.addHook('onRequest', platformAuth)

    privateApp.get('/me', async (request) => request.platformUser)

    privateApp.post('/auth/change-password', async (request) => {
      const input = z.object({ currentPassword: z.string().min(1), newPassword: password }).parse(request.body)
      const user = await prisma.platformUser.findUniqueOrThrow({ where: { id: request.platformUser.id } })
      if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) throw new UnauthorizedError('Senha atual incorreta')
      await prisma.platformUser.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(input.newPassword, 12) } })
      await audit(user.id, 'password_changed', `platform_user:${user.id}`)
      return { changed: true }
    })

    privateApp.get('/overview', async () => {
      const [companies, demoRequests, activeSubscriptions, plans] = await Promise.all([
        prisma.company.count(), prisma.demoRequest.count(), prisma.companySubscription.count({ where: { status: 'active' } }), prisma.plan.count(),
      ])
      return { companies, demoRequests, activeSubscriptions, plans }
    })

    privateApp.get('/demo-requests', async () => prisma.demoRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }))

    privateApp.get('/companies', async () => prisma.company.findMany({
      orderBy: { createdAt: 'desc' }, take: 200,
      include: {
        users: { where: { role: 'OWNER' }, select: { id: true, name: true, email: true, isActive: true } },
        subscription: { include: { plan: true } },
        siteSettings: { select: { maintenanceEnabled: true } },
        _count: { select: { vehicles: true, leads: true, users: true } },
      },
    }))

    privateApp.post('/companies', async (request, reply) => {
      const { planId, ...input } = companySchema.parse(request.body)
      if (planId) {
        const plan = await prisma.plan.findUnique({ where: { id: planId } })
        if (!plan || !plan.isActive) throw new NotFoundError('Plano ativo')
      }
      const result = await authService.register(input, planId)
      await audit(request.platformUser.id, 'company_created', `company:${result.company.id}`, { slug: result.company.slug, ownerEmail: result.user.email, planId })
      return reply.status(201).send({ company: result.company, owner: result.user })
    })

    privateApp.get('/plans', async () => prisma.plan.findMany({ orderBy: { createdAt: 'asc' }, include: { _count: { select: { subscriptions: true } } } }))

    privateApp.post('/plans', async (request, reply) => {
      const input = planSchema.parse(request.body)
      const plan = await prisma.plan.create({ data: input })
      await audit(request.platformUser.id, 'plan_created', `plan:${plan.id}`, { code: plan.code })
      return reply.status(201).send(plan)
    })

    privateApp.patch('/plans/:id', async (request) => {
      const { id } = z.object({ id: uuid }).parse(request.params)
      const input = planSchema.partial().parse(request.body)
      const existing = await prisma.plan.findUnique({ where: { id } })
      if (!existing) throw new NotFoundError('Plano')
      const plan = await prisma.plan.update({ where: { id }, data: input })
      await audit(request.platformUser.id, 'plan_updated', `plan:${id}`, { fields: Object.keys(input) })
      return plan
    })

    privateApp.put('/companies/:id/subscription', async (request) => {
      const { id } = z.object({ id: uuid }).parse(request.params)
      const input = subscriptionSchema.parse(request.body)
      const [company, plan] = await Promise.all([prisma.company.findUnique({ where: { id } }), prisma.plan.findUnique({ where: { id: input.planId } })])
      if (!company) throw new NotFoundError('Empresa')
      if (!plan) throw new NotFoundError('Plano')
      const subscription = await prisma.companySubscription.upsert({
        where: { companyId: id },
        create: { companyId: id, planId: input.planId, status: input.status, currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null, notes: input.notes ?? null },
        update: { planId: input.planId, status: input.status, currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : null, notes: input.notes ?? null },
        include: { plan: true },
      })
      await audit(request.platformUser.id, 'subscription_updated', `company:${id}`, { planId: input.planId, status: input.status })
      return subscription
    })

    privateApp.get('/admins', { onRequest: [requirePlatformOwner] }, async () => prisma.platformUser.findMany({ orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } }))

    privateApp.post('/admins', { onRequest: [requirePlatformOwner] }, async (request, reply) => {
      const input = adminSchema.parse(request.body)
      const [exists, storeUser] = await Promise.all([
        prisma.platformUser.findUnique({ where: { email: input.email } }),
        prisma.user.findUnique({ where: { email: input.email } }),
      ])
      if (exists || storeUser) throw new ConflictError('Este e-mail já pertence a outra conta')
      const admin = await prisma.platformUser.create({
        data: { name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), role: 'PLATFORM_ADMIN' },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      })
      await audit(request.platformUser.id, 'admin_created', `platform_user:${admin.id}`, { email: admin.email })
      return reply.status(201).send(admin)
    })

    privateApp.patch('/admins/:id/active', { onRequest: [requirePlatformOwner] }, async (request) => {
      const { id } = z.object({ id: uuid }).parse(request.params)
      const { isActive } = z.object({ isActive: z.boolean() }).parse(request.body)
      if (id === request.platformUser.id) throw new ForbiddenError('Não é possível desativar sua própria conta')
      const target = await prisma.platformUser.findUnique({ where: { id } })
      if (!target) throw new NotFoundError('Administrador')
      if (target.role === 'PLATFORM_OWNER') throw new ForbiddenError('A conta principal não pode ser desativada aqui')
      const admin = await prisma.platformUser.update({ where: { id }, data: { isActive }, select: { id: true, name: true, email: true, role: true, isActive: true } })
      await audit(request.platformUser.id, isActive ? 'admin_activated' : 'admin_deactivated', `platform_user:${id}`)
      return admin
    })

    privateApp.get('/audit', { onRequest: [requirePlatformOwner] }, async () => prisma.platformAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { actor: { select: { name: true, email: true } } } }))
  })
}
