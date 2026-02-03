import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

const CreateEquipmentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(50),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional().default(true)
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const equipmentTypes = await prisma.equipmentType.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(equipmentTypes)
  } catch (error) {
    console.error('Equipment types API error:', error)
    return NextResponse.json(
      { error: 'Error fetching equipment types' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const validatedData = CreateEquipmentTypeSchema.parse(body)

    // Normalize slug to uppercase with underscores
    const normalizedSlug = validatedData.slug.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')

    // Check if slug already exists
    const existing = await prisma.equipmentType.findUnique({
      where: { slug: normalizedSlug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un tipo de equipo con ese identificador' },
        { status: 409 }
      )
    }

    const equipmentType = await prisma.equipmentType.create({
      data: {
        name: validatedData.name,
        slug: normalizedSlug,
        description: validatedData.description || null,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json(equipmentType, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment type:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating equipment type' },
      { status: 500 }
    )
  }
}
