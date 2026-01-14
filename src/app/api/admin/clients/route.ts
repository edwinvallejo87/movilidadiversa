import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const mockCustomers = [
      {
        id: 'temp1',
        name: 'Cliente Temporal',
        email: 'temp@example.com',
        phone: '1234567890',
        isActive: true,
        _count: {
          appointments: 0
        }
      }
    ]

    return NextResponse.json({ customers: mockCustomers })
  } catch (error) {
    console.error('Clients API error:', error)
    return NextResponse.json(
      { error: 'Error fetching clients' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Client creation not available in temp mode' })
}