import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

const CreateDestinationSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  tripType: z.string().min(1, 'Tipo de viaje es requerido'),
  equipmentType: z.string().min(1, 'Tipo de equipo es requerido'),
  originType: z.string().optional().nullable(),
  price: z.number().min(0, 'Precio debe ser mayor o igual a 0'),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const destinations = await prisma.outOfCityDestination.findMany({
      orderBy: [
        { name: 'asc' },
        { tripType: 'asc' }
      ]
    })

    return NextResponse.json(destinations)
  } catch (error) {
    console.error('Error fetching out of city destinations:', error)
    return NextResponse.json(
      { error: 'Error fetching destinations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = CreateDestinationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const data = parsed.data

    const destination = await prisma.outOfCityDestination.create({
      data: {
        name: data.name,
        tripType: data.tripType,
        equipmentType: data.equipmentType,
        originType: data.originType || null,
        price: data.price,
      }
    })

    return NextResponse.json(destination, { status: 201 })
  } catch (error) {
    console.error('Error creating destination:', error)
    return NextResponse.json(
      { error: 'Error creating destination' },
      { status: 500 }
    )
  }
}
