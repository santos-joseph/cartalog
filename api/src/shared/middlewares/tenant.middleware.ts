import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../../database/prisma'
import { AppError } from '../errors/app-error'
import { env } from '../../config/env'

function extractSubdomain(host: string): string | null {
  const hostname = host.split(':')[0]

  if (hostname === 'localhost' || hostname === '127.0.0.1') return null

  // Production: carstore.seudominio.com
  const baseDomain = env.BASE_DOMAIN
  if (hostname.endsWith('.' + baseDomain)) {
    const sub = hostname.slice(0, hostname.length - baseDomain.length - 1)
    if (sub && sub !== 'www' && sub !== 'api') return sub
  }

  // Local dev: carstore.localhost
  const parts = hostname.split('.')
  if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
    const sub = parts[0]
    if (sub !== 'www' && sub !== 'api') return sub
  }

  return null
}

export { extractSubdomain }

export async function tenantMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  const host = request.headers.host ?? ''
  const slug = extractSubdomain(host) || (request.headers['x-tenant-slug'] as string | undefined) || null

  if (!slug) throw new AppError('Tenant not identified — access via a company subdomain or pass X-Tenant-Slug header', 400)

  const company = await prisma.company.findUnique({
    where: { slug },
    include: { siteSettings: true, seoSettings: true },
  })

  if (!company) throw new AppError('Catalog not found', 404)

  request.tenant = company
}

export function extractSlugFromHost(host: string): string | null {
  return extractSubdomain(host)
}
