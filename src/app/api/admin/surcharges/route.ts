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
        price: 25000,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'temp2', 
        code: 'DOMINICAL_FESTIVO',
        name: 'Recargo Dominical/Festivo',
        description: 'Recargo para domingos y días festivos',
        price: 30000,
        isActive: true,
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