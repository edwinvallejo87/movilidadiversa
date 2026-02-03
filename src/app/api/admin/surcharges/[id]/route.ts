import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

const UpdateSurchargeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  name: z.string().min(1, 'Name is required').max(100),
  price: z.number().min(0, 'Price must be non-negative'),
  description: z.string().max(500).nullable().optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateSurchargeSchema.parse(body)

    // Check if surcharge exists
    const existingSurcharge = await prisma.surcharge.findUnique({
      where: { id }
    })

    if (!existingSurcharge) {
      return NextResponse.json(
        { error: 'Surcharge not found' },
        { status: 404 }
      )
    }

    // Check for duplicate code (if code is being changed)
    if (validatedData.code !== existingSurcharge.code) {
      const duplicateCode = await prisma.surcharge.findUnique({
        where: { code: validatedData.code }
      })

      if (duplicateCode) {
        return NextResponse.json(
          { error: 'A surcharge with this code already exists' },
          { status: 409 }
        )
      }
    }

    const surcharge = await prisma.surcharge.update({
      where: { id },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        price: validatedData.price,
        description: validatedData.description || null
      }
    })

    return NextResponse.json(surcharge)
  } catch (error) {
    console.error('Error updating surcharge:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error updating surcharge' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Check if surcharge exists
    const existingSurcharge = await prisma.surcharge.findUnique({
      where: { id }
    })

    if (!existingSurcharge) {
      return NextResponse.json(
        { error: 'Surcharge not found' },
        { status: 404 }
      )
    }

    await prisma.surcharge.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting surcharge:', error)
    return NextResponse.json(
      { error: 'Error deleting surcharge' },
      { status: 500 }
    )
  }
}
