import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const include = searchParams.get('include')
    
    // Return mock appointments data for now
    const mockAppointments = [
      {
        id: 'temp1',
        title: 'Cita Temporal',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
        service: { name: 'Servicio Temporal', color: '#3B82F6' },
        customer: { name: 'Cliente Temporal' },
        staff: null,
        resource: null
      }
    ]

    return NextResponse.json(mockAppointments)
  } catch (error) {
    console.error('Appointments API error:', error)
    return NextResponse.json(
      { error: 'Error fetching appointments' },
      { status: 500 }
    )
  }
}