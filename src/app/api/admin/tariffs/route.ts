import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock tariffs data
    const tariffs = [
      {
        id: 'temp1',
        zoneId: 'medellin',
        zone: { id: 'medellin', name: 'Medellín', slug: 'medellin' },
        tripType: 'SENCILLO',
        equipmentType: 'RAMPA',
        distanceRange: 'HASTA_3KM',
        originType: null,
        price: 85000,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'temp2',
        zoneId: 'medellin',
        zone: { id: 'medellin', name: 'Medellín', slug: 'medellin' },
        tripType: 'DOBLE',
        equipmentType: 'ROBOTICA_PLEGABLE',
        distanceRange: 'DE_3_A_10KM',
        originType: null,
        price: 150000,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json(tariffs)
  } catch (error) {
    console.error('Tariffs API error:', error)
    return NextResponse.json(
      { error: 'Error al cargar las tarifas' },
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