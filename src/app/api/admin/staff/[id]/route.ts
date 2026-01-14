import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateStaffSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.enum(['DRIVER', 'VEHICLE', 'ASSISTANT']).optional(),
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  licensePlate: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
  isWheelchairAccessible: z.boolean().optional(),
  licenseNumber: z.string().optional(),
  workDays: z.string().optional(),
  workStartTime: z.string().optional(),
  workEndTime: z.string().optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staff = await db.staff.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            service: true,
            customer: true
          }
        },
        unavailability: {
          where: {
            endTime: { gte: new Date() }
          },
          orderBy: { startTime: 'asc' }
        },
        _count: {
          select: {
            appointments: true,
            unavailability: true
          }
        }
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json(
      { error: 'Error fetching staff member' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const staffData = UpdateStaffSchema.parse(body)

    // Verificar que el staff existe
    const existingStaff = await db.staff.findUnique({
      where: { id: params.id }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Verificar placa duplicada si se está actualizando
    if (staffData.licensePlate && staffData.licensePlate !== existingStaff.licensePlate) {
      const duplicateVehicle = await db.staff.findFirst({
        where: { 
          licensePlate: staffData.licensePlate,
          type: 'VEHICLE',
          id: { not: params.id }
        }
      })
      
      if (duplicateVehicle) {
        return NextResponse.json(
          { error: 'Vehicle with this license plate already exists' },
          { status: 409 }
        )
      }
    }

    const updatedStaff = await db.staff.update({
      where: { id: params.id },
      data: staffData,
      include: {
        _count: {
          select: {
            appointments: true,
            unavailability: true
          }
        }
      }
    })

    return NextResponse.json(updatedStaff)
  } catch (error) {
    console.error('Error updating staff:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error updating staff member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar que el staff existe
    const existingStaff = await db.staff.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Verificar si tiene citas activas
    const activeAppointments = await db.appointment.count({
      where: {
        staffId: params.id,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    })

    if (activeAppointments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete staff member with active appointments' },
        { status: 409 }
      )
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    const deletedStaff = await db.staff.update({
      where: { id: params.id },
      data: { 
        isActive: false,
        status: 'OFFLINE'
      }
    })

    return NextResponse.json({ message: 'Staff member deactivated successfully' })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { error: 'Error deleting staff member' },
      { status: 500 }
    )
  }
}