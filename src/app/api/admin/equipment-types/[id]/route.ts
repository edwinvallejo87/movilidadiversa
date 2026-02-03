import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

const UpdateEquipmentTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

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
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = UpdateEquipmentTypeSchema.parse(body)

    // Check if equipment type exists
    const existingEquipmentType = await prisma.equipmentType.findUnique({
      where: { id }
    })

    if (!existingEquipmentType) {
      return NextResponse.json(
        { error: 'Tipo de equipo no encontrado' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const equipmentType = await prisma.equipmentType.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(equipmentType)
  } catch (error) {
    console.error('Error updating equipment type:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

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
  const { error } = await requireAuth()
  if (error) return error

  try {
    const { id } = await params

    // Check if equipment type exists
    const existingEquipmentType = await prisma.equipmentType.findUnique({
      where: { id }
    })

    if (!existingEquipmentType) {
      return NextResponse.json(
        { error: 'Tipo de equipo no encontrado' },
        { status: 404 }
      )
    }

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
