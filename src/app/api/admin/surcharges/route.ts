import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock surcharges data
    const surcharges = [
      {
        id: 'temp1',
        code: 'NOCTURNO',
        name: 'Recargo Nocturno',
        description: 'Recargo para servicios entre 6:00 PM y 6:00 AM',
        type: 'TIME_BASED',
        amount: 25000,
        amountType: 'FIXED',
        isActive: true,
        conditionJson: '{"timeRanges":[{"start":"18:00","end":"06:00"}]}',
        createdAt: new Date().toISOString()
      },
      {
        id: 'temp2', 
        code: 'DOMINICAL_FESTIVO',
        name: 'Recargo Dominical/Festivo',
        description: 'Recargo para domingos y días festivos',
        type: 'DAY_BASED',
        amount: 30000,
        amountType: 'FIXED',
        isActive: true,
        conditionJson: '{"daysOfWeek":[0],"holidays":true}',
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json(surcharges)
  } catch (error) {
    console.error('Surcharges API error:', error)
    return NextResponse.json(
      { error: 'Error al cargar los recargos' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint no implementado' },
    { status: 501 }
  )
}