import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const resources = await prisma.resource.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Resources API error:', error)
    return NextResponse.json(
      { error: 'Error fetching resources' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const { name, type, color, isActive } = body

    const resource = await prisma.resource.create({
      data: {
        name,
        type: type || 'VEHICLE',
        color: color || '#3B82F6',
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: 'Error creating resource' },
      { status: 500 }
    )
  }
}
