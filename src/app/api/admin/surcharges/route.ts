import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateSurchargeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(100),
  price: z.number().min(0, 'Price must be non-negative'),
  description: z.string().max(500).nullable().optional()
})

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
    const validatedData = CreateSurchargeSchema.parse(body)

    // Check for duplicate code
    const existing = await prisma.surcharge.findUnique({
      where: { code: validatedData.code }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A surcharge with this code already exists' },
        { status: 409 }
      )
    }

    const surcharge = await prisma.surcharge.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        price: validatedData.price,
        description: validatedData.description || null
      }
    })

    return NextResponse.json(surcharge, { status: 201 })
  } catch (error) {
    console.error('Error creating surcharge:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating surcharge' },
      { status: 500 }
    )
  }
}
