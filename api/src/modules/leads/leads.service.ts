import { Prisma } from '../../../generated/prisma/client'
import { prisma } from '../../database/prisma'
import { NotFoundError } from '../../shared/errors/app-error'
import { getPaginationParams, buildMeta } from '../../shared/utils/pagination'
import type { CreateLeadInput, UpdateLeadInput, CreateInteractionInput, LeadsFilters } from './leads.schema'

export class LeadsService {
  async list(companyId: string, filters: LeadsFilters) {
    const { page, perPage, skip, take } = getPaginationParams(filters)

    const where: Prisma.LeadWhereInput = {
      companyId,
      ...(filters.status && { status: filters.status }),
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
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
          vehicle: {
            select: { id: true, title: true, slug: true, coverImageUrl: true },
          },
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
        vehicle: { select: { id: true, title: true, slug: true, coverImageUrl: true } },
        interactions: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!lead) throw new NotFoundError('Lead')
    return lead
  }

  async create(companyId: string, input: CreateLeadInput) {
    return prisma.lead.create({
      data: { companyId, ...input, email: input.email || undefined },
      include: { vehicle: { select: { id: true, title: true } } },
    })
  }

  async update(companyId: string, leadId: string, input: UpdateLeadInput) {
    await this.findLeadOrThrow(companyId, leadId)
    return prisma.lead.update({ where: { id: leadId }, data: input })
  }

  async addInteraction(companyId: string, leadId: string, userId: string, input: CreateInteractionInput) {
    await this.findLeadOrThrow(companyId, leadId)

    const interaction = await prisma.leadInteraction.create({
      data: { leadId, userId, ...input },
    })

    // Auto-update lead status to CONTACTED if still NEW
    await prisma.lead.updateMany({
      where: { id: leadId, status: 'NEW' },
      data: { status: 'CONTACTED' },
    })

    return interaction
  }

  async getStats(companyId: string) {
    const [total, byStatus, recentLeads] = await Promise.all([
      prisma.lead.count({ where: { companyId } }),

      prisma.lead.groupBy({
        by: ['status'],
        where: { companyId },
        _count: true,
      }),

      prisma.lead.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { vehicle: { select: { title: true } } },
      }),
    ])

    const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count]))

    return {
      total,
      new: statusMap.NEW ?? 0,
      contacted: statusMap.CONTACTED ?? 0,
      negotiating: statusMap.NEGOTIATING ?? 0,
      won: statusMap.WON ?? 0,
      lost: statusMap.LOST ?? 0,
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
