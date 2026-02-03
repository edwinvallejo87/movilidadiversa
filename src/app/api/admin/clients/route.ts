import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { appointments: true }
        }
      }
    })

    return NextResponse.json({ customers })
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
