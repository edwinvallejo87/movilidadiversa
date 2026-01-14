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
      where: { id: serviceId },
      include: {
        tariffRules: {
          where: { isActive: true },
          include: {
            zone: true,
            distanceTiers: true
          }
        }
      }
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

    // 3. Buscar regla de tarifa aplicable
    let applicableRule = null

    // Prioridad 1: Regla específica para la zona de origen
    if (originZone) {
      applicableRule = service.tariffRules.find(rule => rule.zoneId === originZone.id)
    }

    // Prioridad 2: Regla específica para la zona de destino
    if (!applicableRule && destinationZone) {
      applicableRule = service.tariffRules.find(rule => rule.zoneId === destinationZone.id)
    }

    // Prioridad 3: Regla general (sin zona específica)
    if (!applicableRule) {
      applicableRule = service.tariffRules.find(rule => !rule.zoneId)
    }

    // 4. Calcular precio según la regla encontrada
    let estimatedPrice = 15000 // Precio base por defecto

    if (applicableRule) {
      switch (applicableRule.pricingMode) {
        case 'FIXED':
          estimatedPrice = applicableRule.fixedPrice || 15000
          break

        case 'PER_KM':
          if (distanceKm && applicableRule.pricePerKm) {
            estimatedPrice = distanceKm * applicableRule.pricePerKm
            if (applicableRule.minPrice && estimatedPrice < applicableRule.minPrice) {
              estimatedPrice = applicableRule.minPrice
            }
          }
          break

        case 'BY_DISTANCE_TIER':
          if (distanceKm && applicableRule.distanceTiers.length > 0) {
            const tier = applicableRule.distanceTiers.find(t => 
              distanceKm >= t.minKm && (!t.maxKm || distanceKm <= t.maxKm)
            )
            if (tier) {
              estimatedPrice = tier.price
            }
          }
          break

        default:
          // Usar precio fijo como fallback
          estimatedPrice = applicableRule.fixedPrice || 15000
      }
    }

    // 5. Aplicar precio mínimo si está definido
    if (applicableRule?.minPrice && estimatedPrice < applicableRule.minPrice) {
      estimatedPrice = applicableRule.minPrice
    }

    return NextResponse.json({
      estimatedPrice: Math.round(estimatedPrice),
      appliedRule: {
        id: applicableRule?.id,
        pricingMode: applicableRule?.pricingMode,
        zone: applicableRule?.zone?.name || 'General'
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
          details: error.errors
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
  const zones = await db.zone.findMany({
    where: { isActive: true }
  })

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