import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(1).default(60),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
  isActive: z.boolean().default(true)
})

const UpdateServiceSchema = CreateServiceSchema.partial()

export async function GET() {
  try {
    const services = await db.service.findMany({
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Error fetching services' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const serviceData = CreateServiceSchema.parse(body)

    const existingService = await db.service.findUnique({
      where: { name: serviceData.name }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Service with this name already exists' },
        { status: 409 }
      )
    }

    const service = await db.service.create({
      data: serviceData,
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating service' },
      { status: 500 }
    )
  }
}