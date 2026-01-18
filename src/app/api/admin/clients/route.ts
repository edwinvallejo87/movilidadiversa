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
    const { name, email, phone, address, medicalNotes } = body

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        defaultAddress: address,
        medicalNotes
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
