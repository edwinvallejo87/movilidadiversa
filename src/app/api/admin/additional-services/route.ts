import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.additionalService.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching additional services:', error)
    return NextResponse.json(
      { error: 'Error fetching additional services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, price, priceType, description } = body

    const service = await prisma.additionalService.create({
      data: {
        code,
        name,
        price,
        priceType,
        description: description || null
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating additional service:', error)
    return NextResponse.json(
      { error: 'Error creating additional service' },
      { status: 500 }
    )
  }
}
