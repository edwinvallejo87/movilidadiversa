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

interface QuoteRequest {
  zoneSlug: string
  tripType: 'SENCILLO' | 'DOBLE'
  equipmentType: 'RAMPA' | 'ROBOTICA_PLEGABLE'
  originType?: 'DESDE_MEDELLIN' | 'MISMO_MUNICIPIO' | 'MISMA_CIUDAD'
  distanceKm?: number // Only for Medellin
  outOfCityDestination?: string // e.g., "Aeropuerto JMC", "Rionegro", "La Ceja"
  extraKm?: number // Additional km for out of city
  additionalServices?: Array<{
    code: string
    quantity?: number
  }>
  isNightSchedule?: boolean
  isHolidayOrSunday?: boolean
}

interface BreakdownItem {
  item: string
  quantity?: number
  unitPrice: number
  subtotal: number
}

// POST - Calculate quote
export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequest = await request.json()
    const {
      zoneSlug,
      tripType,
      equipmentType,
      originType,
      distanceKm,
      outOfCityDestination,
      extraKm,
      additionalServices = [],
      isNightSchedule = false,
      isHolidayOrSunday = false
    } = body

    // Validate required fields
    if (!zoneSlug || !tripType || !equipmentType) {
      return NextResponse.json(
        { error: 'Missing required fields: zoneSlug, tripType, equipmentType' },
        { status: 400 }
      )
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
      const destination = await prisma.outOfCityDestination.findFirst({
        where: {
          name: outOfCityDestination,
          tripType: tripType,
          equipmentType: equipmentType === 'ROBOTICA_PLEGABLE' ? 'RAMPA' : equipmentType, // Out of city only has RAMPA base
          originType: 'DESDE_MEDELLIN'
        }
      })

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
        const equipLabel = equipmentType === 'RAMPA' ? 'Rampa' : 'Robotica/Plegable'

        breakdown.push({
          item: `${tripType === 'SENCILLO' ? 'Viaje sencillo' : 'Viaje doble'} ${equipLabel} ${distanceLabel}`,
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
        const equipLabel = equipmentType === 'RAMPA' ? 'Rampa' : 'Robotica/Plegable'

        breakdown.push({
          item: `${tripType === 'SENCILLO' ? 'Viaje sencillo' : 'Viaje doble'} ${equipLabel} (${originLabel})`,
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
