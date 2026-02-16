import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateClientSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1, 'Teléfono es requerido'),
  document: z.string().optional().nullable(),
  age: z.union([z.number(), z.string()]).optional().nullable(),
  weight: z.union([z.number(), z.string()]).optional().nullable(),
  wheelchairType: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  medicalNeeds: z.string().optional().nullable(),
  mobilityAid: z.string().optional().nullable(),
  requiresAssistant: z.boolean().optional().default(false),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause for search
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { document: { contains: search } }
      ]
    } : {}

    // Get total count
    const total = await prisma.customer.count({ where })

    // Get paginated customers
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    })

    return NextResponse.json({ customers, total })
  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json(
      { error: 'Error fetching clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = CreateClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const data = parsed.data

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        document: data.document || null,
        age: data.age ? parseInt(String(data.age)) : null,
        weight: data.weight ? parseFloat(String(data.weight)) : null,
        wheelchairType: data.wheelchairType || null,
        defaultAddress: data.address || null,
        medicalNotes: data.medicalNotes || data.medicalNeeds || null,
        mobilityNeeds: data.mobilityAid && data.mobilityAid !== 'NONE' ? JSON.stringify([data.mobilityAid]) : null,
        requiresAssistant: data.requiresAssistant || false,
        emergencyContact: data.emergencyContact || null,
        emergencyPhone: data.emergencyPhone || null,
        isActive: data.isActive,
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Error creating client' },
      { status: 500 }
    )
  }
}
