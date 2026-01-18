import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateRateSchema = z.object({
  price: z.number().min(0, 'Price must be non-negative')
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const rate = await prisma.rate.findUnique({
      where: { id },
      include: { zone: true }
    })

    if (!rate) {
      return NextResponse.json(
        { error: 'Rate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error fetching rate:', error)
    return NextResponse.json(
      { error: 'Error fetching rate' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateRateSchema.parse(body)

    // Check if rate exists
    const existingRate = await prisma.rate.findUnique({
      where: { id }
    })

    if (!existingRate) {
      return NextResponse.json(
        { error: 'Rate not found' },
        { status: 404 }
      )
    }

    const rate = await prisma.rate.update({
      where: { id },
      data: { price: validatedData.price }
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error updating rate:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error updating rate' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if rate exists
    const existingRate = await prisma.rate.findUnique({
      where: { id }
    })

    if (!existingRate) {
      return NextResponse.json(
        { error: 'Rate not found' },
        { status: 404 }
      )
    }

    await prisma.rate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rate:', error)
    return NextResponse.json(
      { error: 'Error deleting rate' },
      { status: 500 }
    )
  }
}
