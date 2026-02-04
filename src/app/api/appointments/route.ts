import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Auto-complete past appointments that weren't completed or cancelled
    const now = new Date()
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

    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause for date filtering
    const where: any = {}
    if (startDate && endDate) {
      where.scheduledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            color: true,
            durationMinutes: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            color: true,
            equipmentType: true
          }
        },
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    // Format appointments for calendar display
    const formattedAppointments = appointments.map(apt => {
      return {
        id: apt.id,
        scheduledAt: apt.scheduledAt,
        estimatedDuration: apt.estimatedDuration,
        status: apt.status,
        totalAmount: apt.totalAmount,
        originAddress: apt.originAddress,
        destinationAddress: apt.destinationAddress,
        notes: apt.notes,
        serviceId: apt.serviceId,
        customerId: apt.customerId,
        staffId: apt.staffId,
        resourceId: apt.resourceId,
        equipmentType: (apt as any).equipmentType || apt.staff?.equipmentType || 'RAMPA',
        service: apt.service,
        customer: apt.customer,
        staff: apt.staff,
        resource: apt.resource
      }
    })

    return NextResponse.json(formattedAppointments)
  } catch (error) {
    console.error('Appointments API error:', error)
    return NextResponse.json(
      { error: 'Error fetching appointments' },
      { status: 500 }
    )
  }
}
