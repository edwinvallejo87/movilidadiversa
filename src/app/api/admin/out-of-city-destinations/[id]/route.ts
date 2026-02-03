import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const { name, tripType, equipmentType, originType, price } = body

    const destination = await prisma.outOfCityDestination.update({
      where: { id },
      data: {
        name,
        tripType,
        equipmentType,
        originType: originType || null,
        price
      }
    })

    return NextResponse.json(destination)
  } catch (error) {
    console.error('Error updating destination:', error)
    return NextResponse.json(
      { error: 'Error updating destination' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    await prisma.outOfCityDestination.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting destination:', error)
    return NextResponse.json(
      { error: 'Error deleting destination' },
      { status: 500 }
    )
  }
}
