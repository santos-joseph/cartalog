import { prisma } from '../../database/prisma'

export class DashboardService {
  async getOverview(companyId: string) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalVehicles,
      vehiclesByStatus,
      totalLeads,
      leadsByStatus,
      newLeadsThisMonth,
      topViewedVehicles,
      recentLeads,
      leadsPerDay,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { companyId } }),

      prisma.vehicle.groupBy({
        by: ['status'],
        where: { companyId },
        _count: true,
      }),

      prisma.lead.count({ where: { companyId } }),

      prisma.lead.groupBy({
        by: ['status'],
        where: { companyId },
        _count: true,
      }),

      prisma.lead.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),

      prisma.vehicle.findMany({
        where: { companyId, status: 'AVAILABLE' },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
          viewCount: true,
          price: true,
          brand: { select: { name: true } },
          model: { select: { name: true } },
        },
      }),

      prisma.lead.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          vehicle: { select: { title: true, slug: true } },
        },
      }),

      // Leads por dia nos últimos 30 dias (raw query para performance)
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT
          DATE(created_at)::text as date,
          COUNT(*)::bigint as count
        FROM leads
        WHERE company_id = ${companyId}
          AND created_at >= ${thirtyDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ])

    const statusVehicleMap = Object.fromEntries(
      vehiclesByStatus.map((s) => [s.status, s._count]),
    )

    const statusLeadMap = Object.fromEntries(
      leadsByStatus.map((s) => [s.status, s._count]),
    )

    return {
      vehicles: {
        total: totalVehicles,
        available: statusVehicleMap.AVAILABLE ?? 0,
        sold: statusVehicleMap.SOLD ?? 0,
        reserved: statusVehicleMap.RESERVED ?? 0,
        inactive: statusVehicleMap.INACTIVE ?? 0,
      },
      leads: {
        total: totalLeads,
        newThisMonth: newLeadsThisMonth,
        new: statusLeadMap.NEW ?? 0,
        contacted: statusLeadMap.CONTACTED ?? 0,
        negotiating: statusLeadMap.NEGOTIATING ?? 0,
        won: statusLeadMap.WON ?? 0,
        lost: statusLeadMap.LOST ?? 0,
      },
      topViewedVehicles,
      recentLeads,
      leadsPerDay: leadsPerDay.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
    }
  }
}

export const dashboardService = new DashboardService()
