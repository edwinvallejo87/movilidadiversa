import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const QuoteRequestSchema = z.object({
  // Ubicación
  zoneSlug: z.string(),
  outOfCityDestination: z.string().optional(),
  
  // Tipo de servicio
  tripType: z.enum(['SENCILLO', 'DOBLE']),
  equipmentType: z.enum(['RAMPA', 'ROBOTICA_PLEGABLE']),
  
  // Contexto
  originType: z.enum(['DESDE_MEDELLIN', 'MISMO_MUNICIPIO']).optional(),
  distanceKm: z.number().min(0).optional(),
  
  // Servicios adicionales
  additionalServices: z.array(z.object({
    code: z.string(),
    quantity: z.number().min(1).optional()
  })).optional(),
  
  // Recargos
  isNightSchedule: z.boolean().optional(),
  isHolidayOrSunday: z.boolean().optional(),
  
  // Para fuera de ciudad
  extraKm: z.number().min(0).optional()
})

interface QuoteResponse {
  basePrice: number
  additionalServicesTotal: number
  surchargesTotal: number
  extraKmTotal: number
  totalPrice: number
  breakdown: {
    item: string
    quantity?: number
    unitPrice: number
    subtotal: number
  }[]
}

// Helper para determinar rango de distancia
function getDistanceRange(km: number): string {
  if (km <= 3) return 'HASTA_3KM'
  if (km <= 10) return 'DE_3_A_10KM'
  return 'MAS_10KM'
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json()
    const quoteRequest = QuoteRequestSchema.parse(body)

    const breakdown = []
    let basePrice = 0
    let additionalServicesTotal = 0
    let surchargesTotal = 0
    let extraKmTotal = 0

    // 1. Determinar tarifa base según zona
    if (quoteRequest.zoneSlug === 'medellin') {
      // Para Medellín, usar rango de distancia
      const distanceRange = getDistanceRange(quoteRequest.distanceKm || 0)
      
      const rate = await db.rate.findFirst({
        where: {
          zone: { slug: 'medellin' },
          tripType: quoteRequest.tripType,
          equipmentType: quoteRequest.equipmentType,
          distanceRange: distanceRange
        },
        include: { zone: true }
      })

      if (!rate) {
        return NextResponse.json(
          { error: `No se encontró tarifa para ${quoteRequest.tripType} ${quoteRequest.equipmentType} ${distanceRange} en Medellín` },
          { status: 404 }
        )
      }

      basePrice = rate.price
      breakdown.push({
        item: `Servicio ${quoteRequest.tripType} ${quoteRequest.equipmentType} (${distanceRange})`,
        unitPrice: rate.price,
        subtotal: rate.price
      })
      
    } else if (quoteRequest.outOfCityDestination) {
      // Fuera de ciudad - buscar destino específico
      const destination = await db.outOfCityDestination.findFirst({
        where: {
          name: quoteRequest.outOfCityDestination,
          tripType: quoteRequest.tripType,
          equipmentType: quoteRequest.equipmentType,
          originType: quoteRequest.originType || null
        }
      })

      if (!destination) {
        return NextResponse.json(
          { error: `No se encontró tarifa para ${quoteRequest.outOfCityDestination} ${quoteRequest.tripType} ${quoteRequest.equipmentType}` },
          { status: 404 }
        )
      }

      basePrice = destination.price
      breakdown.push({
        item: `${quoteRequest.outOfCityDestination} ${quoteRequest.tripType} ${quoteRequest.equipmentType}`,
        unitPrice: destination.price,
        subtotal: destination.price
      })
      
      // Recargo por silla robótica fuera de ciudad
      if (quoteRequest.equipmentType === 'ROBOTICA_PLEGABLE') {
        const config = await db.pricingConfig.findFirst()
        const roboticSurcharge = config?.roboticSurcharge || 40000
        
        basePrice += roboticSurcharge
        breakdown.push({
          item: 'Recargo silla robótica (fuera ciudad)',
          unitPrice: roboticSurcharge,
          subtotal: roboticSurcharge
        })
      }
      
      // KM adicionales
      if (quoteRequest.extraKm && quoteRequest.extraKm > 0) {
        const config = await db.pricingConfig.findFirst()
        const pricePerKm = config?.pricePerKm || 8500
        
        extraKmTotal = quoteRequest.extraKm * pricePerKm
        breakdown.push({
          item: 'Kilómetros adicionales',
          quantity: quoteRequest.extraKm,
          unitPrice: pricePerKm,
          subtotal: extraKmTotal
        })
      }
      
    } else {
      // Otros municipios del área metropolitana
      if (!quoteRequest.originType) {
        return NextResponse.json(
          { error: 'Se requiere especificar el tipo de origen para municipios metropolitanos' },
          { status: 400 }
        )
      }

      const rate = await db.rate.findFirst({
        where: {
          zone: { slug: quoteRequest.zoneSlug },
          tripType: quoteRequest.tripType,
          equipmentType: quoteRequest.equipmentType,
          originType: quoteRequest.originType
        },
        include: { zone: true }
      })

      if (!rate) {
        return NextResponse.json(
          { error: `No se encontró tarifa para ${quoteRequest.zoneSlug} ${quoteRequest.tripType} ${quoteRequest.equipmentType} ${quoteRequest.originType}` },
          { status: 404 }
        )
      }

      basePrice = rate.price
      breakdown.push({
        item: `${rate.zone.name} ${quoteRequest.tripType} ${quoteRequest.equipmentType} (${quoteRequest.originType})`,
        unitPrice: rate.price,
        subtotal: rate.price
      })
    }

    // 2. Calcular servicios adicionales
    if (quoteRequest.additionalServices) {
      for (const service of quoteRequest.additionalServices) {
        const serviceData = await db.additionalService.findUnique({
          where: { code: service.code }
        })

        if (!serviceData) {
          continue // Skip unknown services
        }
        
        let subtotal = serviceData.price
        
        if (serviceData.priceType !== 'FIJO' && service.quantity) {
          subtotal = serviceData.price * service.quantity
        }
        
        additionalServicesTotal += subtotal
        breakdown.push({
          item: serviceData.name,
          quantity: service.quantity,
          unitPrice: serviceData.price,
          subtotal
        })
      }
    }

    // 3. Calcular recargos
    if (quoteRequest.isNightSchedule) {
      const surcharge = await db.surcharge.findUnique({
        where: { code: 'NOCTURNO' }
      })
      
      if (surcharge) {
        surchargesTotal += surcharge.price
        breakdown.push({
          item: surcharge.name,
          unitPrice: surcharge.price,
          subtotal: surcharge.price
        })
      }
    }
    
    if (quoteRequest.isHolidayOrSunday) {
      const surcharge = await db.surcharge.findUnique({
        where: { code: 'DOMINICAL_FESTIVO' }
      })
      
      if (surcharge) {
        surchargesTotal += surcharge.price
        breakdown.push({
          item: surcharge.name,
          unitPrice: surcharge.price,
          subtotal: surcharge.price
        })
      }
    }

    // 4. Total
    const totalPrice = basePrice + additionalServicesTotal + surchargesTotal + extraKmTotal

    const response: QuoteResponse = {
      basePrice,
      additionalServicesTotal,
      surchargesTotal,
      extraKmTotal,
      totalPrice,
      breakdown
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error calculating quote:', error)
    
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
      { error: 'Error al calcular la cotización' },
      { status: 500 }
    )
  }
}

// GET endpoints para obtener datos del cotizador
export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    switch (type) {
      case 'zones':
        const zones = await db.zone.findMany({
          orderBy: { name: 'asc' }
        })
        return NextResponse.json(zones)

      case 'additional-services':
        const additionalServices = await db.additionalService.findMany({
          orderBy: { name: 'asc' }
        })
        return NextResponse.json(additionalServices)

      case 'surcharges':
        const surcharges = await db.surcharge.findMany({
          orderBy: { name: 'asc' }
        })
        return NextResponse.json(surcharges)

      case 'out-of-city-destinations':
        const destinations = await db.outOfCityDestination.findMany({
          select: { name: true },
          distinct: ['name'],
          orderBy: { name: 'asc' }
        })
        return NextResponse.json(destinations.map(d => d.name))

      default:
        return NextResponse.json(
          { error: 'Tipo de consulta no válido. Use: zones, additional-services, surcharges, out-of-city-destinations' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error fetching quote data:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}