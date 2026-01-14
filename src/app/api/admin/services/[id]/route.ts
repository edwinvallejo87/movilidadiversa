import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await db.service.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            customer: true
          }
        },
        tariffRules: {
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            appointments: true,
            tariffRules: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Error fetching service' },
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
    const serviceData = UpdateServiceSchema.parse(body)

    const existingService = await db.service.findUnique({
      where: { id: params.id }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (serviceData.name && serviceData.name !== existingService.name) {
      const duplicateService = await db.service.findFirst({
        where: { 
          name: serviceData.name,
          id: { not: params.id },
          isActive: true
        }
      })
      
      if (duplicateService) {
        return NextResponse.json(
          { error: 'Service with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedService = await db.service.update({
      where: { id: params.id },
      data: serviceData,
      include: {
        _count: {
          select: {
            appointments: true,
            tariffRules: true
          }
        }
      }
    })

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error('Error updating service:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error updating service' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingService = await db.service.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const activeAppointments = await db.appointment.count({
      where: {
        serviceId: params.id,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    })

    if (activeAppointments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service with active appointments' },
        { status: 409 }
      )
    }

    const deletedService = await db.service.update({
      where: { id: params.id },
      data: { 
        isActive: false
      }
    })

    return NextResponse.json({ message: 'Service deactivated successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Error deleting service' },
      { status: 500 }
    )
  }
}