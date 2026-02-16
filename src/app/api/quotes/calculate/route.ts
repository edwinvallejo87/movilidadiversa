import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch reference data for quote form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'zones': {
        const zones = await prisma.zone.findMany({
          orderBy: { name: 'asc' }
        })
        return NextResponse.json(zones.map(z => ({
          id: z.id,
          name: z.name,
          slug: z.slug,
          isMetro: z.isMetro
        })))
      }

      case 'additional-services': {
        const services = await prisma.additionalService.findMany({
          orderBy: { name: 'asc' }
        })
        return NextResponse.json(services)
      }

      case 'surcharges': {
        const surcharges = await prisma.surcharge.findMany()
        return NextResponse.json(surcharges)
      }

      case 'out-of-city-destinations': {
        const destinations = await prisma.outOfCityDestination.findMany({
          distinct: ['name'],
          select: { name: true }
        })
        return NextResponse.json(destinations.map(d => d.name))
      }

      case 'pricing-config': {
        const config = await prisma.pricingConfig.findFirst()
        return NextResponse.json(config || { pricePerKm: 8500, roboticSurcharge: 40000 })
      }

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }
  } catch (error) {
    console.error('Quotes API GET error:', error)
    return NextResponse.json(
      { error: 'Error fetching quotes data' },
      { status: 500 }
    )
  }
}

import { z } from 'zod'

function getEquipLabel(type: string): string {
  const labels: Record<string, string> = { 'RAMPA': 'Rampa', 'ROBOTICA_PLEGABLE': 'Robotica/Plegable' }
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ')
}

const QuoteRequestSchema = z.object({
  zoneSlug: z.string().min(1, 'Zona es requerida'),
  tripType: z.enum(['SENCILLO', 'DOBLE']),
  equipmentType: z.string().min(1, 'Tipo de equipo es requerido'),
  originType: z.enum(['DESDE_MEDELLIN', 'MISMO_MUNICIPIO', 'MISMA_CIUDAD']).optional(),
  distanceKm: z.number().optional(),
  outOfCityDestination: z.string().optional(),
  extraKm: z.number().optional(),
  additionalServices: z.array(z.object({
    code: z.string(),
    quantity: z.number().optional(),
  })).optional().default([]),
  scheduledAt: z.string().optional(),
  isNightSchedule: z.boolean().optional().default(false),
  isHolidayOrSunday: z.boolean().optional().default(false),
})

interface BreakdownItem {
  item: string
  code?: string
  type?: string
  quantity?: number
  unitPrice: number
  subtotal: number
}

// POST - Calculate quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = QuoteRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const {
      zoneSlug,
      tripType,
      equipmentType,
      originType,
      distanceKm,
      outOfCityDestination,
      extraKm,
      additionalServices,
      scheduledAt,
      isNightSchedule: isNightScheduleParam,
      isHolidayOrSunday: isHolidayOrSundayParam
    } = parsed.data

    // Calculate night schedule and holiday from scheduledAt if provided
    let isNightSchedule = isNightScheduleParam
    let isHolidayOrSunday = isHolidayOrSundayParam

    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt)
      const hour = scheduledDate.getHours()

      // Get night surcharge config from database
      const nightSurcharge = await prisma.surcharge.findUnique({
        where: { code: 'NOCTURNO' }
      })

      if (nightSurcharge && nightSurcharge.startHour !== null && nightSurcharge.endHour !== null) {
        const startHour = nightSurcharge.startHour ?? 18
        const endHour = nightSurcharge.endHour ?? 6
        // Night is from startHour to endHour (crossing midnight)
        isNightSchedule = hour >= startHour || hour < endHour
      }

      // Check if Sunday
      isHolidayOrSunday = scheduledDate.getDay() === 0
    }

    const breakdown: BreakdownItem[] = []
    let totalPrice = 0

    // Get zone
    const zone = await prisma.zone.findUnique({
      where: { slug: zoneSlug }
    })

    if (!zone) {
      return NextResponse.json(
        { error: `Zone not found: ${zoneSlug}` },
        { status: 404 }
      )
    }

    // CASE 1: Out of city destination
    if (zoneSlug === 'fuera-ciudad' && outOfCityDestination) {
      // For out-of-city, always use DESDE_MEDELLIN as that's how rates are defined
      // Try exact equipment type first, then fallback to RAMPA base rate
      let destination = await prisma.outOfCityDestination.findFirst({
        where: {
          name: outOfCityDestination,
          tripType: tripType,
          equipmentType: equipmentType,
          originType: 'DESDE_MEDELLIN'
        }
      })
      if (!destination && equipmentType !== 'RAMPA') {
        destination = await prisma.outOfCityDestination.findFirst({
          where: {
            name: outOfCityDestination,
            tripType: tripType,
            equipmentType: 'RAMPA',
            originType: 'DESDE_MEDELLIN'
          }
        })
      }

      if (destination) {
        breakdown.push({
          item: `${tripType === 'SENCILLO' ? 'Viaje sencillo' : 'Viaje doble'} a ${outOfCityDestination}`,
          unitPrice: destination.price,
          subtotal: destination.price
        })
        totalPrice += destination.price

        // Add robotic surcharge for out of city if using robotic equipment
        if (equipmentType === 'ROBOTICA_PLEGABLE') {
          const config = await prisma.pricingConfig.findFirst()
          const roboticSurcharge = config?.roboticSurcharge || 40000
          breakdown.push({
            item: 'Recargo por silla robotica',
            unitPrice: roboticSurcharge,
            subtotal: roboticSurcharge
          })
          totalPrice += roboticSurcharge
        }

        // Add extra KM if applicable
        if (extraKm && extraKm > 0) {
          const config = await prisma.pricingConfig.findFirst()
          const pricePerKm = config?.pricePerKm || 8500
          const extraKmCost = extraKm * pricePerKm
          breakdown.push({
            item: 'Kilometros adicionales',
            quantity: extraKm,
            unitPrice: pricePerKm,
            subtotal: extraKmCost
          })
          totalPrice += extraKmCost
        }
      } else {
        return NextResponse.json(
          { error: `Destination rate not found for: ${outOfCityDestination}` },
          { status: 404 }
        )
      }
    }
    // CASE 2: Medellin (distance-based)
    else if (zoneSlug === 'medellin') {
      // Determine distance range
      let distanceRange: string
      if (!distanceKm || distanceKm <= 3) {
        distanceRange = 'HASTA_3KM'
      } else if (distanceKm <= 10) {
        distanceRange = 'DE_3_A_10KM'
      } else {
        distanceRange = 'MAS_10KM'
      }

      const rate = await prisma.rate.findFirst({
        where: {
          zoneId: zone.id,
          tripType: tripType,
          equipmentType: equipmentType,
          distanceRange: distanceRange
        }
      })

      if (rate) {
        const distanceLabel = distanceRange === 'HASTA_3KM' ? '(hasta 3km)' :
                              distanceRange === 'DE_3_A_10KM' ? '(3-10km)' : '(mas de 10km)'
        breakdown.push({
          item: `${tripType === 'SENCILLO' ? 'Viaje sencillo' : 'Viaje doble'} ${getEquipLabel(equipmentType)} ${distanceLabel}`,
          unitPrice: rate.price,
          subtotal: rate.price
        })
        totalPrice += rate.price
      } else {
        return NextResponse.json(
          { error: `Rate not found for Medellin with distance range: ${distanceRange}` },
          { status: 404 }
        )
      }
    }
    // CASE 3: Other metropolitan zones (origin-based)
    else {
      const effectiveOriginType = originType || 'DESDE_MEDELLIN'

      const rate = await prisma.rate.findFirst({
        where: {
          zoneId: zone.id,
          tripType: tripType,
          equipmentType: equipmentType,
          originType: effectiveOriginType
        }
      })

      if (rate) {
        const originLabel = effectiveOriginType === 'DESDE_MEDELLIN' ? 'desde Medellin' : 'mismo municipio'

        breakdown.push({
          item: `${tripType === 'SENCILLO' ? 'Viaje sencillo' : 'Viaje doble'} ${getEquipLabel(equipmentType)} (${originLabel})`,
          unitPrice: rate.price,
          subtotal: rate.price
        })
        totalPrice += rate.price
      } else {
        return NextResponse.json(
          { error: `Rate not found for zone: ${zone.name}` },
          { status: 404 }
        )
      }
    }

    // Add additional services
    for (const svc of additionalServices) {
      const service = await prisma.additionalService.findUnique({
        where: { code: svc.code }
      })

      if (service) {
        const quantity = svc.quantity || 1
        let subtotal = service.price

        if (service.priceType === 'POR_HORA' || service.priceType === 'POR_UNIDAD') {
          subtotal = service.price * quantity
        }

        breakdown.push({
          item: service.name,
          code: service.code,
          type: 'additional_service',
          quantity: quantity > 1 ? quantity : undefined,
          unitPrice: service.price,
          subtotal: subtotal
        })
        totalPrice += subtotal
      }
    }

    // Add surcharges
    if (isNightSchedule) {
      const nightSurcharge = await prisma.surcharge.findUnique({
        where: { code: 'NOCTURNO' }
      })
      if (nightSurcharge) {
        breakdown.push({
          item: nightSurcharge.name,
          unitPrice: nightSurcharge.price,
          subtotal: nightSurcharge.price
        })
        totalPrice += nightSurcharge.price
      }
    }

    if (isHolidayOrSunday) {
      const holidaySurcharge = await prisma.surcharge.findUnique({
        where: { code: 'DOMINICAL_FESTIVO' }
      })
      if (holidaySurcharge) {
        breakdown.push({
          item: holidaySurcharge.name,
          unitPrice: holidaySurcharge.price,
          subtotal: holidaySurcharge.price
        })
        totalPrice += holidaySurcharge.price
      }
    }

    return NextResponse.json({
      zone: zone.name,
      tripType,
      equipmentType,
      breakdown,
      totalPrice
    })
  } catch (error) {
    console.error('Quotes API POST error:', error)
    return NextResponse.json(
      { error: 'Error calculating quote' },
      { status: 500 }
    )
  }
}
