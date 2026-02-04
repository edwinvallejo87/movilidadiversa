import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

function getDateRange(timeRange: string) {
  const now = new Date()
  const end = now
  
  switch (timeRange) {
    case 'last7days':
      return {
        start: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)),
        end
      }
    case 'last30days':
      return {
        start: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)),
        end
      }
    case 'last3months':
      return {
        start: new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)),
        end
      }
    case 'last6months':
      return {
        start: new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000)),
        end
      }
    case 'lastyear':
      return {
        start: new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)),
        end
      }
    default:
      return {
        start: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)),
        end
      }
  }
}

function getStatusFromString(status: string) {
  const statusMap: { [key: string]: string } = {
    'PENDING': 'pending',
    'SCHEDULED': 'pending',
    'CONFIRMED': 'pending',  // All active/programmed appointments
    'IN_PROGRESS': 'pending',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'NO_SHOW': 'cancelled'
  }
  return statusMap[status] || 'pending'
}

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'last30days'
    
    const { start, end } = getDateRange(timeRange)
    
    // Get appointments in date range
    const appointments = await db.appointment.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        service: true,
        staff: true,
        customer: true
      }
    })

    // Calculate metrics
    const totalAppointments = appointments.length
    const totalRevenue = appointments.reduce((sum, apt) => sum + (apt.totalAmount || 0), 0)
    
    // Count by status - simulating since we don't have ratings
    const statusCounts = appointments.reduce((acc, apt) => {
      const status = getStatusFromString(apt.status)
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const completedAppointments = statusCounts.completed || 0
    const cancelledAppointments = statusCounts.cancelled || 0
    const pendingAppointments = statusCounts.pending || 0

    // Simulate average rating (in real app, this would come from a ratings table)
    const averageRating = 4.2 + (Math.random() * 0.6) // Random between 4.2-4.8

    // Top services (based on equipment type)
    const equipmentLabels: Record<string, string> = {
      'RAMPA': 'Vehículo con Rampa',
      'ROBOTICA_PLEGABLE': 'Silla Robótica/Plegable'
    }

    const serviceStats = appointments.reduce((acc, apt) => {
      const serviceName = equipmentLabels[apt.equipmentType] || apt.equipmentType || 'Desconocido'
      if (!acc[serviceName]) {
        acc[serviceName] = { count: 0, revenue: 0 }
      }
      acc[serviceName].count += 1
      acc[serviceName].revenue += apt.totalAmount || 0
      return acc
    }, {} as Record<string, { count: number, revenue: number }>)

    const topServices = Object.entries(serviceStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)

    // Staff performance
    const staffStats = appointments.reduce((acc, apt) => {
      const staffName = apt.staff?.name || 'Sin asignar'
      if (!acc[staffName]) {
        acc[staffName] = { appointments: 0, revenue: 0 }
      }
      acc[staffName].appointments += 1
      acc[staffName].revenue += apt.totalAmount || 0
      return acc
    }, {} as Record<string, { appointments: number, revenue: number }>)

    const staffPerformance = Object.entries(staffStats).map(([name, stats]) => ({
      name,
      appointments: stats.appointments,
      revenue: stats.revenue,
      rating: 4.0 + (Math.random() * 1.0) // Simulate rating between 4.0-5.0
    })).sort((a, b) => b.appointments - a.appointments)

    // Monthly stats - group by month
    const monthlyStats = appointments.reduce((acc, apt) => {
      const date = new Date(apt.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = new Intl.DateTimeFormat('es', { 
        year: 'numeric', 
        month: 'long' 
      }).format(date)

      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthName, appointments: 0, revenue: 0 }
      }
      acc[monthKey].appointments += 1
      acc[monthKey].revenue += apt.totalAmount || 0
      return acc
    }, {} as Record<string, { month: string, appointments: number, revenue: number }>)

    const monthlyStat = Object.values(monthlyStats)
      .sort((a, b) => a.month.localeCompare(b.month))

    const metrics = {
      totalAppointments,
      totalRevenue,
      averageRating,
      completedAppointments,
      cancelledAppointments,
      pendingAppointments,
      topServices,
      monthlyStats: monthlyStat,
      staffPerformance
    }

    return NextResponse.json(metrics)
    
  } catch (error) {
    console.error('Error generating metrics:', error)
    return NextResponse.json(
      { error: 'Error generating reports' },
      { status: 500 }
    )
  }
}