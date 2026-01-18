import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const surcharges = await prisma.surcharge.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(surcharges)
  } catch (error) {
    console.error('Error fetching surcharges:', error)
    return NextResponse.json(
      { error: 'Error fetching surcharges' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, price, description } = body

    const surcharge = await prisma.surcharge.create({
      data: {
        code,
        name,
        price,
        description: description || null
      }
    })

    return NextResponse.json(surcharge, { status: 201 })
  } catch (error) {
    console.error('Error creating surcharge:', error)
    return NextResponse.json(
      { error: 'Error creating surcharge' },
      { status: 500 }
    )
  }
}