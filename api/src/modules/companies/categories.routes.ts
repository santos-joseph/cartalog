import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../database/prisma'
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import { NotFoundError, ConflictError } from '../../shared/errors/app-error'
import { slugify } from '../../shared/utils/slug'

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
})

const updateCategorySchema = createCategorySchema.partial()

export async function categoriesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authMiddleware)

  // GET /companies/categories
  app.get('/', async (request) => {
    return prisma.category.findMany({
      where: { companyId: request.user.companyId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { vehicles: true } } },
    })
  })

  // POST /companies/categories
  app.post('/', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const { name } = createCategorySchema.parse(request.body)
    const slug = slugify(name)

    const existing = await prisma.category.findUnique({
      where: { companyId_slug: { companyId: request.user.companyId, slug } },
    })
    if (existing) throw new ConflictError(`Categoria "${name}"`)

    const category = await prisma.category.create({
      data: { companyId: request.user.companyId, name, slug },
    })
    return reply.status(201).send(category)
  })

  // PUT /companies/categories/:id
  app.put('/:id', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { name } = updateCategorySchema.parse(request.body)

    const category = await prisma.category.findFirst({
      where: { id, companyId: request.user.companyId },
    })
    if (!category) throw new NotFoundError('Category')

    if (name) {
      const slug = slugify(name)
      const conflict = await prisma.category.findFirst({
        where: { companyId: request.user.companyId, slug, NOT: { id } },
      })
      if (conflict) throw new ConflictError(`Categoria "${name}"`)

      const updated = await prisma.category.update({
        where: { id },
        data: { name, slug },
      })
      return reply.send(updated)
    }

    return reply.send(category)
  })

  // DELETE /companies/categories/:id
  app.delete('/:id', { onRequest: [requireRole('OWNER')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const category = await prisma.category.findFirst({
      where: { id, companyId: request.user.companyId },
    })
    if (!category) throw new NotFoundError('Category')
    await prisma.category.delete({ where: { id } })
    return reply.status(204).send()
  })
}
