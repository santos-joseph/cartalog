import { prisma } from '../../database/prisma'

export class DashboardService {
  async getOverview(companyId: string) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalVehicles,
      vehiclesByStatus,
      totalLeads,
      leadStatuses,
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

      prisma.leadStatus.findMany({
        where: { companyId },
        orderBy: { position: 'asc' },
        include: { _count: { select: { leads: true } } },
      }),

      prisma.lead.count({
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
      }),

      prisma.vehicle.findMany({
        where: { companyId, status: 'available' },
        select: {
          id: true,
          slug: true,
          year: true,
          price: true,
          model: { select: { name: true, brand: { select: { name: true } } } },
          images: { where: { isCover: true }, take: 1, select: { imageUrl: true } },
          _count: { select: { views: true } },
        },
        orderBy: { views: { _count: 'desc' } },
        take: 5,
      }),

      prisma.lead.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          vehicle: {
            select: {
              id: true,
              slug: true,
              year: true,
              model: { select: { name: true, brand: { select: { name: true } } } },
            },
          },
          status: { select: { name: true } },
        },
      }),

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

    return {
      vehicles: {
        total: totalVehicles,
        available: statusVehicleMap.available ?? 0,
        sold: statusVehicleMap.sold ?? 0,
        reserved: statusVehicleMap.reserved ?? 0,
      },
      leads: {
        total: totalLeads,
        newThisMonth: newLeadsThisMonth,
        byStatus: leadStatuses.map((s) => ({
          id: s.id,
          name: s.name,
          position: s.position,
          count: s._count.leads,
        })),
      },
      topViewedVehicles: topViewedVehicles.map((v) => ({
        ...v,
        viewCount: v._count.views,
      })),
      recentLeads,
      leadsPerDay: leadsPerDay.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
    }
  }
}

export const dashboardService = new DashboardService()
