import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateAppointmentSchema = z.object({
  staffId: z.string().cuid().nullable().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  actualStartTime: z.string().datetime().optional(),
  actualEndTime: z.string().datetime().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: {
        service: true,
        customer: true,
        staff: true,
        fromZone: true,
        toZone: true
      }
    })

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(appointment)

  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json(
      { error: 'Error fetching appointment' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updateData = UpdateAppointmentSchema.parse(body)

    // Verificar que la cita existe
    const existingAppointment = await db.appointment.findUnique({
      where: { id: params.id }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Si se asigna staff, verificar que esté disponible
    if (updateData.staffId) {
      const staff = await db.staff.findUnique({
        where: { id: updateData.staffId }
      })

      if (!staff || !staff.isActive || staff.status !== 'AVAILABLE') {
        return NextResponse.json(
          { error: 'Staff member not available' },
          { status: 400 }
        )
      }
    }

    // Actualizar la cita
    const updatedAppointment = await db.appointment.update({
      where: { id: params.id },
      data: {
        ...updateData,
        actualStartTime: updateData.actualStartTime ? new Date(updateData.actualStartTime) : undefined,
        actualEndTime: updateData.actualEndTime ? new Date(updateData.actualEndTime) : undefined,
        updatedAt: new Date()
      },
      include: {
        service: true,
        customer: true,
        staff: true,
        fromZone: true,
        toZone: true
      }
    })

    return NextResponse.json(updatedAppointment)

  } catch (error) {
    console.error('Error updating appointment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error updating appointment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que la cita existe
    const existingAppointment = await db.appointment.findUnique({
      where: { id: params.id }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // En lugar de eliminar, cambiar estado a CANCELLED
    const cancelledAppointment = await db.appointment.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        service: true,
        customer: true,
        staff: true,
        fromZone: true,
        toZone: true
      }
    })

    return NextResponse.json(cancelledAppointment)

  } catch (error) {
    console.error('Error cancelling appointment:', error)
    return NextResponse.json(
      { error: 'Error cancelling appointment' },
      { status: 500 }
    )
  }
}