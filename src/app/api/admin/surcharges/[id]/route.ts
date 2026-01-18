import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { code, name, price, description } = body

    const surcharge = await prisma.surcharge.update({
      where: { id },
      data: {
        code,
        name,
        price,
        description: description || null
      }
    })

    return NextResponse.json(surcharge)
  } catch (error) {
    console.error('Error updating surcharge:', error)
    return NextResponse.json(
      { error: 'Error updating surcharge' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

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
