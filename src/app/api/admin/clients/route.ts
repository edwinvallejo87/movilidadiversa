import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const {
      name,
      email,
      phone,
      document,
      age,
      weight,
      wheelchairType,
      address,
      medicalNotes,
      medicalNeeds,
      mobilityAid,
      emergencyContact,
      emergencyPhone,
      notes,
      isActive = true
    } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone,
        document: document || null,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        wheelchairType: wheelchairType || null,
        defaultAddress: address || null,
        medicalNotes: medicalNotes || medicalNeeds || null,
        mobilityNeeds: mobilityAid && mobilityAid !== 'NONE' ? JSON.stringify([mobilityAid]) : null,
        emergencyContact: emergencyContact || null,
        isActive
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
