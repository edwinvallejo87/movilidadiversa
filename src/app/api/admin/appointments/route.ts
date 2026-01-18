import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateAdminAppointmentSchema = z.object({
  customerId: z.string().min(1),
  serviceId: z.string().min(1).optional(),  // Optional - legacy
  staffId: z.string().min(1).optional(),
  resourceId: z.string().min(1).optional(),
  equipmentType: z.enum(['RAMPA', 'ROBOTICA_PLEGABLE']).optional().default('RAMPA'),
  scheduledAt: z.string().datetime(),
  originAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  originLat: z.number().optional(),
  originLng: z.number().optional(),
  destinationLat: z.number().optional(),
  destinationLng: z.number().optional(),
  distanceKm: z.number().optional(),
  estimatedAmount: z.number().optional(),
  notes: z.string().optional(),
  pricingBreakdown: z.array(z.object({
    item: z.string(),
    quantity: z.number().optional(),
    unitPrice: z.number().optional(),
    subtotal: z.number()
  })).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const appointmentData = CreateAdminAppointmentSchema.parse(body)

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: appointmentData.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verify and get staff if provided (to get equipment type)
    let staffMember = null
    if (appointmentData.staffId) {
      staffMember = await db.staff.findUnique({
        where: { id: appointmentData.staffId }
      })

      if (!staffMember) {
        return NextResponse.json(
          { error: 'Conductor no encontrado' },
          { status: 404 }
        )
      }
    }

    // Get equipment type from staff or use provided/default
    const equipmentType = staffMember?.equipmentType || appointmentData.equipmentType || 'RAMPA'

    // Crear la cita
    const appointment = await db.appointment.create({
      data: {
        customerId: appointmentData.customerId,
        serviceId: appointmentData.serviceId || null,
        staffId: appointmentData.staffId,
        resourceId: appointmentData.resourceId,
        equipmentType,
        scheduledAt: new Date(appointmentData.scheduledAt),
        originAddress: appointmentData.originAddress || 'Sin dirección',
        destinationAddress: appointmentData.destinationAddress || 'Sin dirección',
        originLat: appointmentData.originLat || 0,
        originLng: appointmentData.originLng || 0,
        destinationLat: appointmentData.destinationLat || 0,
        destinationLng: appointmentData.destinationLng || 0,
        distanceKm: appointmentData.distanceKm || 0,
        estimatedDuration: 60,  // Default duration
        notes: appointmentData.notes,
        status: 'SCHEDULED',
        totalAmount: appointmentData.estimatedAmount || 0,
        pricingSnapshot: JSON.stringify({
          method: appointmentData.pricingBreakdown ? 'quote_calculation' : 'admin_manual',
          equipmentType,
          breakdown: appointmentData.pricingBreakdown || null
        })
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
      }
    })

    return NextResponse.json(appointment, { status: 201 })

  } catch (error) {
    console.error('Error creating admin appointment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de cita inválidos',
          details: error.issues
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