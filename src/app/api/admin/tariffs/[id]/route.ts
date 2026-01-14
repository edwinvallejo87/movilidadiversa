import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateTariffSchema = z.object({
  zoneId: z.string().cuid().optional(),
  serviceId: z.string().cuid().optional(),
  pricingMode: z.enum(['FIXED', 'PER_KM', 'BY_DISTANCE_TIER']).optional(),
  fixedPrice: z.number().min(0).optional(),
  pricePerKm: z.number().min(0).optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const tariffData = UpdateTariffSchema.parse(body)

    const existingTariff = await db.tariffRule.findUnique({
      where: { id }
    })

    if (!existingTariff) {
      return NextResponse.json(
        { error: 'Tariff not found' },
        { status: 404 }
      )
    }

    const tariff = await db.tariffRule.update({
      where: { id },
      data: tariffData,
      include: {
        zone: true,
        service: true,
        distanceTiers: {
          orderBy: { minKm: 'asc' }
        }
      }
    })

    return NextResponse.json(tariff)
  } catch (error) {
    console.error('Error updating tariff:', error)
    
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
      { error: 'Error updating tariff' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const existingTariff = await db.tariffRule.findUnique({
      where: { id }
    })

    if (!existingTariff) {
      return NextResponse.json(
        { error: 'Tariff not found' },
        { status: 404 }
      )
    }

    await db.tariffRule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tariff:', error)
    return NextResponse.json(
      { error: 'Error deleting tariff' },
      { status: 500 }
    )
  }
}