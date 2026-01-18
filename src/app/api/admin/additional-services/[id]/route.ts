import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { code, name, price, priceType, description } = body

    const service = await prisma.additionalService.update({
      where: { id },
      data: {
        code,
        name,
        price,
        priceType,
        description: description || null
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating additional service:', error)
    return NextResponse.json(
      { error: 'Error updating additional service' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    await prisma.additionalService.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting additional service:', error)
    return NextResponse.json(
      { error: 'Error deleting additional service' },
      { status: 500 }
    )
  }
}
