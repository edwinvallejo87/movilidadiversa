import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const AvailabilityQuerySchema = z.object({
  serviceId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().min(30).optional().default(60)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = AvailabilityQuerySchema.parse({
      serviceId: searchParams.get('serviceId'),
      date: searchParams.get('date'),
      durationMinutes: searchParams.get('durationMinutes') 
        ? parseInt(searchParams.get('durationMinutes')!) 
        : undefined
    })

    const service = await db.service.findFirst({
      where: { 
        id: query.serviceId,
        isActive: true 
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found or inactive' },
        { status: 404 }
      )
    }

    const requestDate = new Date(query.date)
    const startOfDay = new Date(requestDate)
    startOfDay.setHours(6, 0, 0, 0)
    
    const endOfDay = new Date(requestDate)
    endOfDay.setHours(22, 0, 0, 0)

    const existingAppointments = await db.appointment.findMany({
      where: {
        serviceId: query.serviceId,
        scheduledAt: {
          gte: startOfDay,
          lt: endOfDay
        },
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    const availableSlots = []
    const slotDuration = query.durationMinutes
    const bufferTime = 30

    let currentTime = new Date(startOfDay)

    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000)
      
      if (slotEnd > endOfDay) break

      const hasConflict = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.scheduledAt)
        const appointmentEnd = new Date(
          appointmentStart.getTime() + appointment.estimatedDuration * 60000
        )

        const slotStartWithBuffer = new Date(currentTime.getTime() - bufferTime * 60000)
        const slotEndWithBuffer = new Date(slotEnd.getTime() + bufferTime * 60000)

        return (
          (slotStartWithBuffer < appointmentEnd && slotEndWithBuffer > appointmentStart) ||
          (appointmentStart < slotEnd && appointmentEnd > currentTime)
        )
      })

      if (!hasConflict) {
        availableSlots.push({
          startTime: currentTime.toISOString(),
          endTime: slotEnd.toISOString(),
          duration: slotDuration
        })
      }

      currentTime = new Date(currentTime.getTime() + 30 * 60000)
    }

    return NextResponse.json({
      date: query.date,
      serviceId: query.serviceId,
      serviceName: service.name,
      availableSlots,
      totalSlots: availableSlots.length
    })

  } catch (error) {
    console.error('Availability check error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error checking availability'
      },
      { status: 500 }
    )
  }
}