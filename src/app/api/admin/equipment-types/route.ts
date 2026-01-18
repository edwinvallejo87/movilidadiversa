import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
  try {
    const body = await request.json()
    const { name, slug, description, isActive } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nombre y slug son requeridos' },
        { status: 400 }
      )
    }

    // Normalize slug to uppercase with underscores
    const normalizedSlug = slug.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')

    // Check if slug already exists
    const existing = await prisma.equipmentType.findUnique({
      where: { slug: normalizedSlug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un tipo de equipo con ese identificador' },
        { status: 400 }
      )
    }

    const equipmentType = await prisma.equipmentType.create({
      data: {
        name,
        slug: normalizedSlug,
        description: description || null,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(equipmentType, { status: 201 })
  } catch (error) {
    console.error('Error creating equipment type:', error)
    return NextResponse.json(
      { error: 'Error creating equipment type' },
      { status: 500 }
    )
  }
}
