import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

const CreateServiceSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional().nullable(),
  durationMinutes: z.number().optional().default(60),
  basePrice: z.number().optional().default(0),
  color: z.string().optional().default('#3B82F6'),
  isActive: z.boolean().optional().default(true),
})

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
    const parsed = CreateServiceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const data = parsed.data

    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description || null,
        durationMinutes: data.durationMinutes,
        basePrice: data.basePrice,
        color: data.color,
        isActive: data.isActive,
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
