import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateAppointmentSchema = z.object({
  staffId: z.string().cuid().nullable().optional(),
  status: z.enum(['PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional(),
  actualStartTime: z.string().datetime().optional(),
  actualEndTime: z.string().datetime().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional()
})

// Full update schema for PUT
const FullUpdateAppointmentSchema = z.object({
  customerId: z.string().optional(),
  staffId: z.string().nullable().optional(),
  scheduledAt: z.string().optional(),
  returnAt: z.string().nullable().optional(),  // Return time for round trips
  originAddress: z.string().optional(),
  destinationAddress: z.string().optional(),
  notes: z.string().optional().nullable(),
  estimatedAmount: z.number().optional(),
  distanceKm: z.number().optional(),
  equipmentType: z.string().min(1).optional(),
  status: z.enum(['PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  pricingBreakdown: z.array(z.object({
    item: z.string(),
    quantity: z.number().optional(),
    unitPrice: z.number().optional(),
    subtotal: z.number()
  })).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        service: true,
        customer: true,
        staff: true,
        resource: true
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData = UpdateAppointmentSchema.parse(body)

    // Verificar que la cita existe
    const existingAppointment = await db.appointment.findUnique({
      where: { id }
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
      where: { id },
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
        resource: true
      }
    })

    return NextResponse.json(updatedAppointment)

  } catch (error) {
    console.error('Error updating appointment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues
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

// PUT - Full update of appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updateData = FullUpdateAppointmentSchema.parse(body)

    // Verify appointment exists
    const existingAppointment = await db.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Build update object
    const dataToUpdate: any = {
      updatedAt: new Date()
    }

    if (updateData.customerId) dataToUpdate.customerId = updateData.customerId
    if (updateData.staffId !== undefined) dataToUpdate.staffId = updateData.staffId || null
    if (updateData.scheduledAt) dataToUpdate.scheduledAt = new Date(updateData.scheduledAt)
    if (updateData.returnAt !== undefined) dataToUpdate.returnAt = updateData.returnAt ? new Date(updateData.returnAt) : null
    if (updateData.originAddress) dataToUpdate.originAddress = updateData.originAddress
    if (updateData.destinationAddress) dataToUpdate.destinationAddress = updateData.destinationAddress
    if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes
    if (updateData.estimatedAmount !== undefined) dataToUpdate.totalAmount = updateData.estimatedAmount
    if (updateData.distanceKm !== undefined) dataToUpdate.distanceKm = updateData.distanceKm
    if (updateData.equipmentType) dataToUpdate.equipmentType = updateData.equipmentType
    if (updateData.status) dataToUpdate.status = updateData.status
    if (updateData.pricingBreakdown) {
      dataToUpdate.pricingSnapshot = JSON.stringify({
        method: 'admin_edit',
        breakdown: updateData.pricingBreakdown
      })
    }

    const updatedAppointment = await db.appointment.update({
      where: { id },
      data: dataToUpdate,
      include: {
        service: true,
        customer: true,
        staff: true,
        resource: true
      }
    })

    return NextResponse.json(updatedAppointment)

  } catch (error) {
    console.error('Error updating appointment (PUT):', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Verificar que la cita existe
    const existingAppointment = await db.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Eliminar la cita permanentemente
    await db.appointment.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Appointment deleted' })

  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json(
      { error: 'Error deleting appointment' },
      { status: 500 }
    )
  }
}