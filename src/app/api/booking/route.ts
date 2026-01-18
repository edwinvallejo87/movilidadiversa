import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const BookingSchema = z.object({
  // Customer info
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
  customerEmail: z.string().email().optional().nullable().or(z.literal('')).or(z.literal(null)),

  // Trip info
  originAddress: z.string().min(5),
  destinationAddress: z.string().min(5),
  scheduledAt: z.string(), // ISO date string

  // Service options
  equipmentType: z.enum(['RAMPA', 'ROBOTICA_PLEGABLE']),
  tripType: z.enum(['SENCILLO', 'DOBLE']),

  // Pricing
  estimatedAmount: z.number(),
  zone: z.string().optional().nullable(),

  // Optional
  notes: z.string().optional().nullable().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = BookingSchema.parse(body)

    // 1. Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: data.customerPhone }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: data.customerName,
          phone: data.customerPhone,
          email: data.customerEmail || null,
        }
      })
    }

    // 2. Find available staff with matching equipment type
    const scheduledDate = new Date(data.scheduledAt)

    // Get staff with matching equipment type
    const availableStaff = await prisma.staff.findMany({
      where: {
        equipmentType: data.equipmentType,
        status: 'AVAILABLE'
      }
    })

    if (availableStaff.length === 0) {
      return NextResponse.json(
        { error: 'No hay conductores disponibles con ese tipo de equipo' },
        { status: 400 }
      )
    }

    // Check which staff are free at the scheduled time
    // Consider a 2-hour window for appointments
    const startWindow = new Date(scheduledDate)
    const endWindow = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000) // +2 hours

    const busyStaffIds = await prisma.appointment.findMany({
      where: {
        staffId: { in: availableStaff.map(s => s.id) },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        scheduledAt: {
          gte: new Date(startWindow.getTime() - 2 * 60 * 60 * 1000), // -2 hours
          lte: endWindow
        }
      },
      select: { staffId: true }
    })

    const busyIds = new Set(busyStaffIds.map(a => a.staffId).filter(Boolean))
    const freeStaff = availableStaff.filter(s => !busyIds.has(s.id))

    if (freeStaff.length === 0) {
      return NextResponse.json(
        { error: 'No hay disponibilidad para esa fecha y hora. Por favor seleccione otro horario.' },
        { status: 400 }
      )
    }

    // Assign first available staff
    const assignedStaff = freeStaff[0]

    // 3. Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId: customer.id,
        staffId: assignedStaff.id,
        equipmentType: data.equipmentType,
        scheduledAt: scheduledDate,
        originAddress: data.originAddress,
        destinationAddress: data.destinationAddress,
        originLat: 0,
        originLng: 0,
        destinationLat: 0,
        destinationLng: 0,
        distanceKm: 0,
        estimatedDuration: data.tripType === 'DOBLE' ? 120 : 60,
        notes: data.notes ? `${data.tripType === 'DOBLE' ? '[VIAJE DOBLE] ' : ''}${data.notes}` : (data.tripType === 'DOBLE' ? '[VIAJE DOBLE]' : null),
        status: 'SCHEDULED',
        totalAmount: data.estimatedAmount,
        pricingSnapshot: JSON.stringify({
          method: 'public_booking',
          equipmentType: data.equipmentType,
          tripType: data.tripType,
          zone: data.zone,
          amount: data.estimatedAmount
        })
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        staff: {
          select: { id: true, name: true, phone: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        scheduledAt: appointment.scheduledAt,
        totalAmount: appointment.totalAmount,
        staff: appointment.staff?.name,
        staffPhone: appointment.staff?.phone
      },
      message: 'Reserva creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Booking API error:', error)

    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', JSON.stringify(error.issues, null, 2))
      return NextResponse.json(
        {
          error: 'Datos incompletos o inválidos',
          details: error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al procesar la reserva: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
