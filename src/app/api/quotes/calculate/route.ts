import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    let mockData: any[] = []
    
    switch (type) {
      case 'zones':
        mockData = [
          { id: 'zone1', name: 'Medellín Centro', baseFare: 15000 }
        ]
        break
      case 'additional-services':
        mockData = [
          { id: 'service1', name: 'Servicio adicional', price: 5000 }
        ]
        break
      case 'out-of-city-destinations':
        mockData = [
          { id: 'dest1', name: 'Rionegro', price: 50000 }
        ]
        break
      default:
        mockData = []
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('Quotes API error:', error)
    return NextResponse.json(
      { error: 'Error fetching quotes data' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json({ 
    estimatedPrice: 15000,
    breakdown: {
      base: 15000,
      distance: 0,
      surcharges: []
    }
  })
}