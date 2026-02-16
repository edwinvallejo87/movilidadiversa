import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

const UpdateDestinationSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  tripType: z.string().min(1, 'Tipo de viaje es requerido'),
  equipmentType: z.string().min(1, 'Tipo de equipo es requerido'),
  originType: z.string().optional().nullable(),
  price: z.number().min(0, 'Precio debe ser mayor o igual a 0'),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = UpdateDestinationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const data = parsed.data

    const destination = await prisma.outOfCityDestination.update({
      where: { id },
      data: {
        name: data.name,
        tripType: data.tripType,
        equipmentType: data.equipmentType,
        originType: data.originType || null,
        price: data.price,
      }
    })

    return NextResponse.json(destination)
  } catch (error) {
    console.error('Error updating destination:', error)
    return NextResponse.json(
      { error: 'Error updating destination' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    await prisma.outOfCityDestination.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting destination:', error)
    return NextResponse.json(
      { error: 'Error deleting destination' },
      { status: 500 }
    )
  }
}
