import { Prisma } from '../../../generated/prisma/client'
import { prisma } from '../../database/prisma'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../shared/errors/app-error'
import { getPaginationParams, buildMeta } from '../../shared/utils/pagination'
import type { CreateLeadInput, UpdateLeadInput, CreateInteractionInput, LeadsFilters, CreateLeadStatusInput, UpdateLeadStatusInput } from './leads.schema'

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
  async list(companyId: string, userId: string, role: string, filters: LeadsFilters) {
    const { page, perPage, skip, take } = getPaginationParams(filters)

    const where: Prisma.LeadWhereInput = {
      companyId,
      ...(filters.scope === 'queue' && { assignedUserId: null, OR: [{ statusId: null }, { status: { kind: 'open' } }] }),
      ...(filters.scope === 'mine' && { assignedUserId: userId }),
      ...(filters.statusId && { statusId: filters.statusId }),
      ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
      ...(filters.assignedUserId && { assignedUserId: filters.assignedUserId }),
      ...(filters.search && {
        AND: [{ OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ] }],
      }),
      ...(role === 'SELLER' && {
        AND: [
          ...(filters.search ? [{ OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { email: { contains: filters.search, mode: 'insensitive' as const } },
            { phone: { contains: filters.search, mode: 'insensitive' as const } },
          ] }] : []),
          { OR: [{ assignedUserId: null }, { assignedUserId: userId }] },
        ],
      }),
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          vehicle: vehicleInclude,
          status: { select: { id: true, name: true, kind: true } },
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

  async findById(companyId: string, leadId: string, userId?: string, role?: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, companyId },
      include: {
        vehicle: vehicleInclude,
        status: { select: { id: true, name: true, kind: true } },
        assignedUser: { select: { id: true, name: true } },
        interactions: { orderBy: { createdAt: 'desc' } },
        followups: { orderBy: { scheduledAt: 'asc' } },
        tags: { include: { tag: true } },
      },
    })
    if (!lead) throw new NotFoundError('Lead')
    if (role === 'SELLER' && lead.assignedUserId && lead.assignedUserId !== userId) {
      throw new ForbiddenError('Lead belongs to another seller')
    }
    const auditEvents = await prisma.storeAuditLog.findMany({
      where: { companyId, target: `lead:${leadId}` },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, action: true, actorName: true, createdAt: true },
    })
    return { ...lead, auditEvents }
  }

  async create(companyId: string, input: CreateLeadInput) {
    if (input.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({ where: { id: input.vehicleId, companyId, status: 'available' } })
      if (!vehicle) throw new ValidationError('Vehicle is unavailable or belongs to another company')
    }
    const initialStatus = await prisma.leadStatus.findFirst({
      where: { companyId, kind: 'open' }, orderBy: { position: 'asc' },
    })
    return prisma.lead.create({
      data: {
        companyId,
        statusId: initialStatus?.id,
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

  async update(companyId: string, leadId: string, userId: string, role: string, input: UpdateLeadInput) {
    const lead = await this.findLeadOrThrow(companyId, leadId)
    if (input.lossReason && !input.statusId) throw new ValidationError('A loss reason requires a lost status')
    if (input.assignedUserId !== undefined && role !== 'OWNER') {
      throw new ForbiddenError('Only the owner can reassign leads')
    }
    if (input.assignedUserId) await this.requireSeller(companyId, input.assignedUserId)
    if (input.statusId !== undefined) {
      if (role !== 'SELLER' || lead.assignedUserId !== userId) {
        throw new ForbiddenError('Only the assigned seller can change lead status')
      }
      if (input.statusId) {
        const status = await prisma.leadStatus.findFirst({ where: { id: input.statusId, companyId } })
        if (!status) throw new ValidationError('Status belongs to another company or does not exist')
        if (status.kind === 'lost' && !input.lossReason?.trim()) {
          throw new ValidationError('A loss reason is required for a lost lead')
        }
        if (status.kind !== 'lost' && input.lossReason) {
          throw new ValidationError('A loss reason is only valid for a lost lead')
        }
      }
    }
    return prisma.$transaction(async (tx) => {
      const updated = await tx.lead.update({
        where: { id: leadId },
        data: {
          ...(input.statusId !== undefined && { statusId: input.statusId }),
          ...(input.assignedUserId !== undefined && { assignedUserId: input.assignedUserId }),
        },
        include: { status: { select: { id: true, name: true, kind: true } }, assignedUser: { select: { id: true, name: true } } },
      })
      if (input.lossReason?.trim()) {
        await tx.leadInteraction.create({ data: { leadId, userId, type: 'loss_reason', note: input.lossReason.trim() } })
      }
      return updated
    })
  }

  async claim(companyId: string, leadId: string, userId: string, role: string) {
    if (role !== 'SELLER') throw new ForbiddenError('Only sellers can claim leads')
    const lead = await prisma.lead.findFirst({ where: { id: leadId, companyId }, include: { status: true } })
    if (!lead) throw new NotFoundError('Lead')
    if (lead.status && lead.status.kind !== 'open') {
      throw new ConflictError('Closed leads cannot be claimed')
    }
    const result = await prisma.lead.updateMany({
      where: { id: leadId, companyId, assignedUserId: null },
      data: { assignedUserId: userId },
    })
    if (!result.count) throw new ConflictError('Lead has already been claimed')
    return this.findById(companyId, leadId, userId, role)
  }

  async release(companyId: string, leadId: string, userId: string, role: string) {
    if (role !== 'SELLER') throw new ForbiddenError('Only sellers can release leads')
    const result = await prisma.lead.updateMany({
      where: { id: leadId, companyId, assignedUserId: userId },
      data: { assignedUserId: null },
    })
    if (!result.count) throw new ForbiddenError('This lead is not assigned to you')
    return this.findById(companyId, leadId, userId, role)
  }

  async addInteraction(companyId: string, leadId: string, userId: string, role: string, input: CreateInteractionInput) {
    const lead = await this.findLeadOrThrow(companyId, leadId)
    if (role !== 'SELLER' || lead.assignedUserId !== userId) {
      throw new ForbiddenError('Only the assigned seller can record interactions')
    }

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

  async createStatus(companyId: string, input: CreateLeadStatusInput) {
    const count = await prisma.leadStatus.count({ where: { companyId } })
    return prisma.leadStatus.create({
      data: { companyId, name: input.name, position: input.position ?? count, kind: input.kind },
    })
  }

  async updateStatus(companyId: string, statusId: string, input: UpdateLeadStatusInput) {
    await this.findStatusOrThrow(companyId, statusId)
    return prisma.leadStatus.update({ where: { id: statusId }, data: input })
  }

  async deleteStatus(companyId: string, statusId: string) {
    await this.findStatusOrThrow(companyId, statusId)
    const leadCount = await prisma.lead.count({ where: { companyId, statusId } })
    if (leadCount) throw new ConflictError('Lead status is in use')
    await prisma.leadStatus.delete({ where: { id: statusId } })
  }

  private async findStatusOrThrow(companyId: string, statusId: string) {
    const status = await prisma.leadStatus.findFirst({ where: { id: statusId, companyId } })
    if (!status) throw new NotFoundError('LeadStatus')
    return status
  }

  async getStats(companyId: string) {
    const [total, queue, statuses, recentLeads] = await Promise.all([
      prisma.lead.count({ where: { companyId } }),
      prisma.lead.count({ where: { companyId, assignedUserId: null, OR: [{ statusId: null }, { status: { kind: 'open' } }] } }),

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
          status: { select: { name: true, kind: true } },
        },
      }),
    ])

    return {
      total,
      byStatus: statuses.map((s) => ({
        id: s.id,
        name: s.name,
        kind: s.kind,
        position: s.position,
        count: s._count.leads,
      })),
      queue,
      recentLeads,
    }
  }

  private async findLeadOrThrow(companyId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, companyId } })
    if (!lead) throw new NotFoundError('Lead')
    return lead
  }

  private async requireSeller(companyId: string, userId: string) {
    const seller = await prisma.user.findFirst({ where: { id: userId, companyId, role: 'SELLER', isActive: true } })
    if (!seller) throw new ValidationError('Assigned user must be a seller from this company')
  }
}

export const leadsService = new LeadsService()
