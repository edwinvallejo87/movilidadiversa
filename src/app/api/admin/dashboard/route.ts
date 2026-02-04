import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    // Get today's date range in Colombia timezone (UTC-5)
    const now = new Date()

    // Auto-complete past appointments that weren't completed or cancelled
    await prisma.appointment.updateMany({
      where: {
        scheduledAt: {
          lt: now
        },
        status: {
          in: ['PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
        }
      },
      data: {
        status: 'COMPLETED'
      }
    })
    const colombiaOffset = -5 * 60 // UTC-5 in minutes
    const localOffset = now.getTimezoneOffset()
    const colombiaTime = new Date(now.getTime() + (localOffset - colombiaOffset) * 60 * 1000)

    const startOfDay = new Date(Date.UTC(
      colombiaTime.getFullYear(),
      colombiaTime.getMonth(),
      colombiaTime.getDate(),
      5, 0, 0, 0 // 00:00 Colombia = 05:00 UTC
    ))
    const endOfDay = new Date(Date.UTC(
      colombiaTime.getFullYear(),
      colombiaTime.getMonth(),
      colombiaTime.getDate() + 1,
      5, 0, 0, 0 // 00:00 next day Colombia = 05:00 UTC
    ))

    // Get start and end of current month (in Colombia timezone)
    const startOfMonth = new Date(Date.UTC(colombiaTime.getFullYear(), colombiaTime.getMonth(), 1, 5, 0, 0))
    const endOfMonth = new Date(Date.UTC(colombiaTime.getFullYear(), colombiaTime.getMonth() + 1, 1, 4, 59, 59))

    // Fetch all stats in parallel
    const [
      todayAppointments,
      activeResources,
      totalCustomers,
      monthAppointments,
      todayAppointmentsList
    ] = await Promise.all([
      // Today's appointments count
      prisma.appointment.count({
        where: {
          scheduledAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      // Active staff (conductors with vehicles)
      prisma.staff.count({
        where: {
          isActive: true
        }
      }),
      // Total customers
      prisma.customer.count(),
      // Month's appointments with total amount for revenue
      prisma.appointment.findMany({
        where: {
          scheduledAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          status: {
            in: ['COMPLETED', 'CONFIRMED', 'SCHEDULED']
          }
        },
        select: {
          totalAmount: true
        }
      }),
      // Today's appointments list for display
      prisma.appointment.findMany({
        where: {
          scheduledAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        select: {
          id: true,
          scheduledAt: true,
          equipmentType: true,
          status: true,
          customer: {
            select: {
              name: true
            }
          },
          staff: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          scheduledAt: 'asc'
        },
        take: 5
      })
    ])

    // Calculate month revenue
    const monthRevenue = monthAppointments.reduce((sum, apt) => {
      const amount = apt.totalAmount
      if (amount === null || amount === undefined) return sum
      // Handle both Decimal and number types
      return sum + (typeof amount === 'number' ? amount : Number(amount))
    }, 0)

    // Format revenue
    const formatCurrency = (amount: number) => {
      if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`
      } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`
      }
      return `$${amount.toLocaleString()}`
    }

    return NextResponse.json({
      stats: {
        todayAppointments,
        activeResources,
        totalCustomers,
        monthRevenue: formatCurrency(monthRevenue),
        monthRevenueRaw: monthRevenue
      },
      todayAppointmentsList: todayAppointmentsList.map(apt => {
        const equipmentLabels: Record<string, string> = {
          'RAMPA': 'Vehículo con Rampa',
          'ROBOTICA_PLEGABLE': 'Silla Robótica/Plegable'
        }
        const equipmentColors: Record<string, string> = {
          'RAMPA': '#3B82F6',
          'ROBOTICA_PLEGABLE': '#8B5CF6'
        }
        return {
          id: apt.id,
          scheduledAt: apt.scheduledAt,
          customerName: apt.customer?.name || 'Sin cliente',
          serviceName: equipmentLabels[apt.equipmentType] || apt.equipmentType,
          serviceColor: equipmentColors[apt.equipmentType] || '#3B82F6',
          staffName: apt.staff?.name || 'Sin asignar',
          status: apt.status
        }
      })
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Error fetching dashboard data' },
      { status: 500 }
    )
  }
}
