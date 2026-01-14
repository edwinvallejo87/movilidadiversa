import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const mockServices = [
      {
        id: 'temp1',
        name: 'Servicio Temporal',
        description: 'Servicio de prueba',
        durationMinutes: 60,
        color: '#3B82F6',
        isActive: true,
        _count: {
          appointments: 0
        }
      }
    ]

    return NextResponse.json({ services: mockServices })
  } catch (error) {
    console.error('Services API error:', error)
    return NextResponse.json(
      { error: 'Error fetching services' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Service creation not available in temp mode' })
}