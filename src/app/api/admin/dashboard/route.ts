import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get start and end of current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

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
      // Active resources (vehicles)
      prisma.resource.count({
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
        include: {
          customer: {
            select: {
              name: true
            }
          },
          service: {
            select: {
              name: true,
              color: true
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
      todayAppointmentsList: todayAppointmentsList.map(apt => ({
        id: apt.id,
        scheduledAt: apt.scheduledAt,
        customerName: apt.customer?.name || 'Sin cliente',
        serviceName: apt.service?.name || 'Sin servicio',
        serviceColor: apt.service?.color || '#3B82F6',
        staffName: apt.staff?.name || 'Sin asignar',
        status: apt.status
      }))
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Error fetching dashboard data' },
      { status: 500 }
    )
  }
}
