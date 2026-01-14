import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CalculatePricingSchema = z.object({
  originAddress: z.string(),
  destinationAddress: z.string(),
  serviceId: z.string().cuid(),
  distanceKm: z.number().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originAddress, destinationAddress, serviceId, distanceKm } = CalculatePricingSchema.parse(body)

    // 1. Buscar el servicio
    const service = await db.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    // 2. Detectar zonas según las direcciones
    const originZone = await findZoneByAddress(originAddress)
    const destinationZone = await findZoneByAddress(destinationAddress)

    // 3. Calcular precio basado en servicio base
    let estimatedPrice = service.basePrice || 15000 // Precio base del servicio

    // 4. Ajustar precio por distancia si está disponible
    if (distanceKm) {
      // Buscar si hay alguna zona aplicable para ajustar tarifa
      let zoneRate = 0
      if (originZone) {
        zoneRate = originZone.perKmRate || 0
      } else if (destinationZone) {
        zoneRate = destinationZone.perKmRate || 0
      }
      
      if (zoneRate > 0) {
        estimatedPrice = estimatedPrice + (distanceKm * zoneRate)
      }
    }

    return NextResponse.json({
      estimatedPrice: Math.round(estimatedPrice),
      service: {
        id: service.id,
        name: service.name,
        basePrice: service.basePrice
      },
      zones: {
        origin: originZone?.name,
        destination: destinationZone?.name
      }
    })

  } catch (error) {
    console.error('Error calculating pricing:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Parámetros inválidos',
          details: error.issues
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al calcular precio' },
      { status: 500 }
    )
  }
}

// Función auxiliar para detectar zona según dirección
async function findZoneByAddress(address: string): Promise<any> {
  const zones = await db.zone.findMany()

  // Buscar por nombre de zona en la dirección
  const lowerAddress = address.toLowerCase()
  
  for (const zone of zones) {
    const zoneName = zone.name.toLowerCase()
    if (lowerAddress.includes(zoneName)) {
      return zone
    }
  }

  return null
}