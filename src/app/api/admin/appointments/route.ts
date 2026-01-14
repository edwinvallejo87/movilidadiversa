import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateAdminAppointmentSchema = z.object({
  customerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().cuid().optional(),
  resourceId: z.string().cuid().optional(),
  scheduledAt: z.string().datetime(),
  originAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destinationLat: z.number().optional(),
  destinationLng: z.number().optional(),
  distanceKm: z.number().optional(),
  estimatedAmount: z.number().optional(),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const appointmentData = CreateAdminAppointmentSchema.parse(body)

    // Verificar que el customer y service existen
    const customer = await db.customer.findUnique({
      where: { id: appointmentData.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const service = await db.service.findUnique({
      where: { id: appointmentData.serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar staff si se proporciona
    if (appointmentData.staffId) {
      const staff = await db.staff.findUnique({
        where: { id: appointmentData.staffId }
      })

      if (!staff) {
        return NextResponse.json(
          { error: 'Staff no encontrado' },
          { status: 404 }
        )
      }
    }

    // Verificar resource si se proporciona
    if (appointmentData.resourceId) {
      const resource = await db.resource.findUnique({
        where: { id: appointmentData.resourceId }
      })

      if (!resource) {
        return NextResponse.json(
          { error: 'Recurso no encontrado' },
          { status: 404 }
        )
      }
    }

    // Crear la cita
    const appointment = await db.appointment.create({
      data: {
        customerId: appointmentData.customerId,
        serviceId: appointmentData.serviceId,
        staffId: appointmentData.staffId,
        resourceId: appointmentData.resourceId,
        scheduledAt: new Date(appointmentData.scheduledAt),
        originAddress: appointmentData.originAddress || 'Sin dirección',
        destinationAddress: appointmentData.destinationAddress || 'Sin dirección',
        originLat: appointmentData.originLat || 0,
        originLng: appointmentData.originLng || 0,
        destinationLat: appointmentData.destinationLat || 0,
        destinationLng: appointmentData.destinationLng || 0,
        distanceKm: appointmentData.distanceKm || 0,
        estimatedDuration: service.durationMinutes,
        notes: appointmentData.notes,
        status: 'SCHEDULED',
        totalAmount: appointmentData.estimatedAmount || service.basePrice || 0,
        pricingSnapshot: JSON.stringify({ method: 'admin_manual', basePrice: service.basePrice })
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
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
            color: true
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
      }
    })

    return NextResponse.json(appointment, { status: 201 })

  } catch (error) {
    console.error('Error creating admin appointment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos de cita inválidos',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear la cita' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')

    const where: any = {}
    
    if (status) {
      where.status = status
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
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
            color: true
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
        scheduledAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await db.appointment.count({ where })

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching admin appointments:', error)
    return NextResponse.json(
      { error: 'Error al obtener las citas' },
      { status: 500 }
    )
  }
}