import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateResourceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(['VEHICLE', 'EQUIPMENT', 'ROOM']).default('VEHICLE'),
  color: z.string().default('#10B981'),
  capacity: z.number().int().min(1).optional()
})

export async function GET() {
  try {
    const resources = await db.resource.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(resources)

  } catch (error) {
    console.error('Error fetching resources:', error)
    return NextResponse.json(
      { error: 'Error fetching resources' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const resourceData = CreateResourceSchema.parse(body)

    const resource = await db.resource.create({
      data: resourceData,
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    return NextResponse.json(resource, { status: 201 })

  } catch (error) {
    console.error('Error creating resource:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid resource data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating resource' },
      { status: 500 }
    )
  }
}