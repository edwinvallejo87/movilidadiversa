import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateAdditionalServiceSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(100),
  price: z.number().min(0, 'Price must be non-negative'),
  priceType: z.enum(['FIJO', 'POR_HORA', 'POR_UNIDAD']),
  description: z.string().max(500).nullable().optional()
})

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
    const validatedData = CreateAdditionalServiceSchema.parse(body)

    // Check for duplicate code
    const existing = await prisma.additionalService.findUnique({
      where: { code: validatedData.code }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A service with this code already exists' },
        { status: 409 }
      )
    }

    const service = await prisma.additionalService.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        price: validatedData.price,
        priceType: validatedData.priceType,
        description: validatedData.description || null
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating additional service:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating additional service' },
      { status: 500 }
    )
  }
}
