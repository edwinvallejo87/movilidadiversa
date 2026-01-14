import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateRateSchema = z.object({
  zoneId: z.string().cuid(),
  tripType: z.enum(['SENCILLO', 'DOBLE']),
  equipmentType: z.enum(['RAMPA', 'ROBOTICA_PLEGABLE']),
  originType: z.enum(['DESDE_MEDELLIN', 'MISMO_MUNICIPIO']).optional(),
  distanceRange: z.enum(['HASTA_3KM', 'DE_3_A_10KM', 'MAS_10KM']).optional(),
  price: z.number().min(0)
})

export async function GET() {
  try {
    const rates = await db.rate.findMany({
      include: {
        zone: true
      },
      orderBy: [
        { zone: { name: 'asc' } },
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
  try {
    const body = await request.json()
    const rateData = CreateRateSchema.parse(body)

    // Verify zone exists
    const zone = await db.zone.findUnique({ where: { id: rateData.zoneId } })
    if (!zone) {
      return NextResponse.json(
        { error: 'Zone not found' },
        { status: 404 }
      )
    }

    // Check if rate already exists for this combination
    const existingRate = await db.rate.findFirst({
      where: {
        zoneId: rateData.zoneId,
        tripType: rateData.tripType,
        equipmentType: rateData.equipmentType,
        originType: rateData.originType,
        distanceRange: rateData.distanceRange
      }
    })

    if (existingRate) {
      return NextResponse.json(
        { error: 'Rate already exists for this combination' },
        { status: 409 }
      )
    }

    const rate = await db.rate.create({
      data: rateData,
      include: {
        zone: true
      }
    })

    return NextResponse.json(rate, { status: 201 })
  } catch (error) {
    console.error('Error creating rate:', error)
    
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
      { error: 'Error creating rate' },
      { status: 500 }
    )
  }
}