import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateZoneSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug es requerido'),
  isMetro: z.boolean().default(true)
})

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { rates: true }
        }
      }
    })

    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json(
      { error: 'Error al cargar las zonas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateZoneSchema.parse(body)

    const existingZone = await prisma.zone.findUnique({
      where: { slug: validatedData.slug }
    })

    if (existingZone) {
      return NextResponse.json(
        { error: 'Ya existe una zona con ese slug' },
        { status: 400 }
      )
    }

    const zone = await prisma.zone.create({
      data: validatedData,
      include: {
        _count: {
          select: { rates: true }
        }
      }
    })

    return NextResponse.json(zone)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating zone:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
