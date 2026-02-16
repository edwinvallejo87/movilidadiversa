import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

const CreateResourceSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  type: z.string().optional().default('VEHICLE'),
  color: z.string().optional().default('#3B82F6'),
  isActive: z.boolean().optional().default(true),
})

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
    const parsed = CreateResourceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const data = parsed.data

    const resource = await prisma.resource.create({
      data: {
        name: data.name,
        type: data.type,
        color: data.color,
        isActive: data.isActive,
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
