import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
  try {
    const body = await request.json()
    const { name, tripType, equipmentType, originType, price } = body

    const destination = await prisma.outOfCityDestination.create({
      data: {
        name,
        tripType,
        equipmentType,
        originType: originType || null,
        price
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
