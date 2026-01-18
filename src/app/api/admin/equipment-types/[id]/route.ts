import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const equipmentType = await prisma.equipmentType.findUnique({
      where: { id }
    })

    if (!equipmentType) {
      return NextResponse.json(
        { error: 'Tipo de equipo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(equipmentType)
  } catch (error) {
    console.error('Error fetching equipment type:', error)
    return NextResponse.json(
      { error: 'Error fetching equipment type' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, isActive } = body

    const equipmentType = await prisma.equipmentType.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    })

    return NextResponse.json(equipmentType)
  } catch (error) {
    console.error('Error updating equipment type:', error)
    return NextResponse.json(
      { error: 'Error updating equipment type' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Soft delete - just deactivate
    await prisma.equipmentType.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting equipment type:', error)
    return NextResponse.json(
      { error: 'Error deleting equipment type' },
      { status: 500 }
    )
  }
}
