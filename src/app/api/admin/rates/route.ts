import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

const CreateRateSchema = z.object({
  zoneId: z.string().min(1, 'Zone ID is required'),
  tripType: z.enum(['SENCILLO', 'DOBLE']),
  equipmentType: z.string().min(1, 'Equipment type is required'),
  originType: z.enum(['MISMO_MUNICIPIO', 'DESDE_MEDELLIN']).nullable().optional(),
  distanceRange: z.string().nullable().optional(),
  destinationName: z.string().nullable().optional(),
  price: z.number().min(0, 'Price must be non-negative')
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const rates = await prisma.rate.findMany({
      orderBy: [
        { zoneId: 'asc' },
        { tripType: 'asc' },
        { equipmentType: 'asc' }
      ]
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching rates:', error)
    return NextResponse.json(
      { error: 'Error fetching rates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const validatedData = CreateRateSchema.parse(body)

    // Verify zone exists
    const zone = await prisma.zone.findUnique({
      where: { id: validatedData.zoneId }
    })

    if (!zone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      )
    }

    const rate = await prisma.rate.create({
      data: {
        zoneId: validatedData.zoneId,
        tripType: validatedData.tripType,
        equipmentType: validatedData.equipmentType,
        originType: validatedData.originType || null,
        distanceRange: validatedData.distanceRange || null,
        destinationName: validatedData.destinationName || null,
        price: validatedData.price
      }
    })

    return NextResponse.json(rate, { status: 201 })
  } catch (error) {
    console.error('Error creating rate:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating rate' },
      { status: 500 }
    )
  }
}
