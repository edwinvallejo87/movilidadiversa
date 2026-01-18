import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
  try {
    const body = await request.json()
    const { zoneId, tripType, equipmentType, originType, distanceRange, destinationName, price } = body

    const rate = await prisma.rate.create({
      data: {
        zoneId,
        tripType,
        equipmentType,
        originType: originType || null,
        distanceRange: distanceRange || null,
        destinationName: destinationName || null,
        price
      }
    })

    return NextResponse.json(rate, { status: 201 })
  } catch (error) {
    console.error('Error creating rate:', error)
    return NextResponse.json(
      { error: 'Error creating rate' },
      { status: 500 }
    )
  }
}
