import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateZoneSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  coordinates: z.string().optional(),
  baseFare: z.number().min(0, 'La tarifa base debe ser mayor o igual a 0'),
  perKmRate: z.number().min(0, 'La tarifa por KM debe ser mayor o igual a 0'),
  isActive: z.boolean()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await db.zone.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tariffRules: true,
            appointmentsFrom: true,
            appointmentsTo: true
          }
        }
      }
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Zona no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error fetching zone:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
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
    const validatedData = UpdateZoneSchema.parse(body)

    // Verificar si la zona existe
    const existingZone = await db.zone.findUnique({
      where: { id: params.id }
    })

    if (!existingZone) {
      return NextResponse.json(
        { error: 'Zona no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no exista otra zona activa con el mismo nombre
    if (validatedData.name !== existingZone.name) {
      const duplicateZone = await db.zone.findFirst({
        where: {
          name: validatedData.name,
          isActive: true,
          id: { not: params.id }
        }
      })

      if (duplicateZone) {
        return NextResponse.json(
          { error: 'Ya existe otra zona activa con ese nombre' },
          { status: 400 }
        )
      }
    }

    const updatedZone = await db.zone.update({
      where: { id: params.id },
      data: validatedData
    })

    return NextResponse.json(updatedZone)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating zone:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si la zona existe
    const existingZone = await db.zone.findUnique({
      where: { id: params.id }
    })

    if (!existingZone) {
      return NextResponse.json(
        { error: 'Zona no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si la zona tiene citas asociadas
    const appointmentCount = await db.appointment.count({
      where: {
        OR: [
          { fromZoneId: params.id },
          { toZoneId: params.id }
        ]
      }
    })

    if (appointmentCount > 0) {
      // Si tiene citas, solo desactivar
      const deactivatedZone = await db.zone.update({
        where: { id: params.id },
        data: { isActive: false }
      })

      return NextResponse.json({
        message: 'Zona desactivada (tiene citas asociadas)',
        zone: deactivatedZone
      })
    } else {
      // Si no tiene citas, eliminar completamente
      await db.zone.delete({
        where: { id: params.id }
      })

      return NextResponse.json({
        message: 'Zona eliminada correctamente'
      })
    }
  } catch (error) {
    console.error('Error deleting zone:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}