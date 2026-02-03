import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

const UpdateZoneSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().optional(),
  isMetro: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const zone = await db.zone.findUnique({
      where: { id: id },
      include: {
        rates: true
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateZoneSchema.parse(body)

    // Verificar si la zona existe
    const existingZone = await db.zone.findUnique({
      where: { id: id }
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
          id: { not: id }
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
      where: { id: id },
      data: validatedData
    })

    return NextResponse.json(updatedZone)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    // Verificar si la zona existe
    const existingZone = await db.zone.findUnique({
      where: { id: id }
    })

    if (!existingZone) {
      return NextResponse.json(
        { error: 'Zona no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si la zona tiene tarifas asociadas
    const rateCount = await db.rate.count({
      where: {
        zoneId: id
      }
    })

    if (rateCount > 0) {
      // Si tiene tarifas, solo eliminar las tarifas y luego la zona
      await db.rate.deleteMany({
        where: { zoneId: id }
      })
    }

    // Eliminar la zona
    await db.zone.delete({
      where: { id: id }
    })

    return NextResponse.json({
      message: 'Zona eliminada correctamente'
    })
  } catch (error) {
    console.error('Error deleting zone:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}