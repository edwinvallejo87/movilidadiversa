import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Services API error:', error)
    return NextResponse.json(
      { error: 'Error fetching services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const { name, description, durationMinutes, basePrice, color, isActive } = body

    const service = await prisma.service.create({
      data: {
        name,
        description,
        durationMinutes: durationMinutes || 60,
        basePrice: basePrice || 0,
        color: color || '#3B82F6',
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json(
      { error: 'Error creating service' },
      { status: 500 }
    )
  }
}
