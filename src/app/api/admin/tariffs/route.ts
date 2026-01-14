import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock tariffs data
    const tariffs = [
      {
        id: 'temp1',
        zoneId: 'medellin',
        zone: { id: 'medellin', name: 'Medellín', slug: 'medellin' },
        service: { id: 'service1', name: 'Transporte Básico', isActive: true },
        pricingMode: 'FIXED',
        fixedPrice: 85000,
        pricePerKm: null,
        tripType: 'SENCILLO',
        equipmentType: 'RAMPA',
        distanceRange: 'HASTA_3KM',
        originType: null,
        isActive: true,
        distanceTiers: [],
        createdAt: new Date().toISOString()
      },
      {
        id: 'temp2',
        zoneId: 'medellin',
        zone: { id: 'medellin', name: 'Medellín', slug: 'medellin' },
        service: { id: 'service2', name: 'Transporte Especializado', isActive: true },
        pricingMode: 'PER_KM',
        fixedPrice: null,
        pricePerKm: 12000,
        tripType: 'DOBLE',
        equipmentType: 'ROBOTICA_PLEGABLE',
        distanceRange: 'DE_3_A_10KM',
        originType: null,
        isActive: true,
        distanceTiers: [],
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