import { Prisma } from '../../../generated/prisma/client'
import { prisma } from '../../database/prisma'
import { NotFoundError } from '../../shared/errors/app-error'
import { getPaginationParams, buildMeta } from '../../shared/utils/pagination'
import type { CreateLeadInput, UpdateLeadInput, CreateInteractionInput, LeadsFilters } from './leads.schema'

const vehicleInclude = {
  select: {
    id: true,
    slug: true,
    year: true,
    model: { select: { name: true, brand: { select: { name: true } } } },
    images: { where: { isCover: true }, take: 1, select: { imageUrl: true } },
  },
} as const

export class LeadsService {
  async list(companyId: string, filters: LeadsFilters) {
    const { page, perPage, skip, take } = getPaginationParams(filters)

    const where: Prisma.LeadWhereInput = {
      companyId,
      ...(filters.statusId && { statusId: filters.statusId }),
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.assignedUserId && { assignedUserId: filters.assignedUserId }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          vehicle: vehicleInclude,
          status: { select: { id: true, name: true } },
          assignedUser: { select: { id: true, name: true } },
          _count: { select: { interactions: true } },
        },
        orderBy: { [filters.orderBy]: filters.order },
        skip,
        take,
      }),
      prisma.lead.count({ where }),
    ])

    return { data: leads, meta: buildMeta(total, page, perPage) }
  }

  async findById(companyId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId },
      include: {
        vehicle: vehicleInclude,
        status: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, name: true } },
        interactions: { orderBy: { createdAt: 'desc' } },
        followups: { orderBy: { scheduledAt: 'asc' } },
        tags: { include: { tag: true } },
      },
    })
    if (!lead) throw new NotFoundError('Lead')
    return lead
  }

  async create(companyId: string, input: CreateLeadInput) {
    return prisma.lead.create({
      data: {
        companyId,
        name: input.name,
        email: input.email || undefined,
        phone: input.phone,
        message: input.message,
        source: input.source,
        vehicleId: input.vehicleId,
      },
      include: { vehicle: vehicleInclude },
    })
  }

  async update(companyId: string, leadId: string, input: UpdateLeadInput) {
    await this.findLeadOrThrow(companyId, leadId)
    return prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(input.statusId !== undefined && { statusId: input.statusId }),
        ...(input.assignedUserId !== undefined && { assignedUserId: input.assignedUserId }),
      },
      include: { status: { select: { id: true, name: true } } },
    })
  }

  async addInteraction(companyId: string, leadId: string, userId: string, input: CreateInteractionInput) {
    await this.findLeadOrThrow(companyId, leadId)

    return prisma.leadInteraction.create({
      data: { leadId, userId, type: input.type, note: input.note },
    })
  }

  async getStatuses(companyId: string) {
    return prisma.leadStatus.findMany({
      where: { companyId },
      orderBy: { position: 'asc' },
      include: { _count: { select: { leads: true } } },
    })
  }

  async getStats(companyId: string) {
    const [total, statuses, recentLeads] = await Promise.all([
      prisma.lead.count({ where: { companyId } }),

      prisma.leadStatus.findMany({
        where: { companyId },
        orderBy: { position: 'asc' },
        include: { _count: { select: { leads: true } } },
      }),

      prisma.lead.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          vehicle: vehicleInclude,
          status: { select: { name: true } },
        },
      }),
    ])

    return {
      total,
      byStatus: statuses.map((s) => ({
        id: s.id,
        name: s.name,
        position: s.position,
        count: s._count.leads,
      })),
      recentLeads,
    }
  }

  private async findLeadOrThrow(companyId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, companyId } })
    if (!lead) throw new NotFoundError('Lead')
    return lead
  }
}

export const leadsService = new LeadsService()
