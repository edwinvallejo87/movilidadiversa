import { NextRequest, NextResponse } from 'next/server'

// Temporary endpoint that returns mock data for testing
export async function GET() {
  try {
    // Return mock data to fix frontend immediately
    const mockStaff = [
      {
        id: 'temp1',
        name: 'Staff Member 1',
        type: 'DRIVER',
        status: 'AVAILABLE',
        phone: '',
        email: '',
        isActive: true,
        _count: {
          appointments: 0,
          unavailability: 0
        }
      }
    ]

    return NextResponse.json({ staff: mockStaff })
  } catch (error) {
    console.error('Staff API error:', error)
    return NextResponse.json(
      { error: 'Error fetching staff' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Staff creation not available in temp mode' })
}