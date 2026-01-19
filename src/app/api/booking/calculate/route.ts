import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Zone detection from address
function detectZoneFromAddress(address: string): { zone: string | null, isOutOfCity: boolean } {
  if (!address) return { zone: null, isOutOfCity: false }
  const addr = address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  // Out of city keywords
  const outOfCityKeywords = [
    'aeropuerto', 'jmc', 'jose maria', 'rionegro', 'la ceja',
    'marinilla', 'el retiro', 'abejorral', 'carmen de viboral',
    'guatape', 'penol', 'santa fe de antioquia'
  ]
  if (outOfCityKeywords.some(kw => addr.includes(kw))) {
    return { zone: 'fuera-ciudad', isOutOfCity: true }
  }

  // Medellin
  const medellinKeywords = [
    'medellin', 'poblado', 'laureles', 'estadio', 'belen',
    'floresta', 'calasanz', 'robledo', 'castilla', 'aranjuez',
    'manrique', 'buenos aires', 'la america', 'san javier',
    'guayabal', 'centro medellin'
  ]
  if (medellinKeywords.some(kw => addr.includes(kw))) {
    return { zone: 'medellin', isOutOfCity: false }
  }

  // BIE zone
  const bieKeywords = ['bello', 'itagui', 'envigado']
  if (bieKeywords.some(kw => addr.includes(kw))) {
    return { zone: 'bello-itagui-envigado', isOutOfCity: false }
  }

  // Sabaneta
  if (addr.includes('sabaneta')) {
    return { zone: 'sabaneta', isOutOfCity: false }
  }

  // La Estrella / Caldas
  if (addr.includes('estrella') || addr.includes('caldas')) {
    return { zone: 'la-estrella-caldas', isOutOfCity: false }
  }

  return { zone: null, isOutOfCity: false }
}

// Detect origin type
function detectOriginType(originZone: string | null, destZone: string | null): string {
  if (!originZone || !destZone) return 'DESDE_MEDELLIN'

  if (originZone === 'medellin') return 'DESDE_MEDELLIN'
  if (originZone === destZone) return 'MISMO_MUNICIPIO'
  return 'DESDE_MEDELLIN'
}

// Check if time is night (6PM - 6AM)
function isNightTime(date: Date): boolean {
  const hour = date.getHours()
  return hour >= 18 || hour < 6
}

// Check if date is weekend or holiday
function isWeekendOrHoliday(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originAddress, destinationAddress, equipmentType, tripType, scheduledAt } = body

    if (!originAddress || !destinationAddress || !equipmentType || !tripType) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : new Date()

    // Detect zones
    const originDetection = detectZoneFromAddress(originAddress)
    const destDetection = detectZoneFromAddress(destinationAddress)

    // Use origin zone for pricing (or destination if origin is not detected)
    const pricingZone = originDetection.zone || destDetection.zone || 'medellin'
    const isOutOfCity = destDetection.isOutOfCity || originDetection.isOutOfCity

    let basePrice = 0
    let zoneName = ''
    let breakdown: { item: string, amount: number }[] = []

    if (isOutOfCity) {
      // Get out of city destination price
      const destination = await prisma.outOfCityDestination.findFirst({
        where: {
          tripType,
          equipmentType,
          originType: 'DESDE_MEDELLIN'
        }
      })

      if (destination) {
        basePrice = destination.price
        zoneName = destination.name
      } else {
        // Fallback price for out of city
        basePrice = tripType === 'DOBLE' ? 350000 : 250000
        zoneName = 'Fuera de la ciudad'
      }
      breakdown.push({ item: `Ruta ${zoneName} (${tripType === 'DOBLE' ? 'Ida y vuelta' : 'Solo ida'})`, amount: basePrice })
    } else {
      // Get zone and rate
      const zone = await prisma.zone.findFirst({
        where: { slug: pricingZone }
      })

      if (!zone) {
        // Fallback to default prices
        basePrice = tripType === 'DOBLE' ? 130000 : 70000
        if (equipmentType === 'ROBOTICA_PLEGABLE') {
          basePrice = tripType === 'DOBLE' ? 180000 : 98000
        }
        zoneName = 'Área Metropolitana'
      } else {
        // Find rate for this zone
        const originType = detectOriginType(originDetection.zone, destDetection.zone)

        const rate = await prisma.rate.findFirst({
          where: {
            zoneId: zone.id,
            tripType,
            equipmentType,
            OR: [
              { originType },
              { originType: null },
              { distanceRange: 'HASTA_3KM' } // Default for Medellin
            ]
          }
        })

        if (rate) {
          basePrice = rate.price
        } else {
          // Fallback prices
          basePrice = tripType === 'DOBLE' ? 130000 : 70000
          if (equipmentType === 'ROBOTICA_PLEGABLE') {
            basePrice = tripType === 'DOBLE' ? 180000 : 98000
          }
        }
        zoneName = zone.name
      }
      breakdown.push({ item: `Servicio ${equipmentType === 'ROBOTICA_PLEGABLE' ? 'Silla Robótica' : 'Rampa'} - ${zoneName}`, amount: basePrice })
    }

    // Calculate surcharges
    let surcharges: { item: string, amount: number }[] = []

    // Night surcharge
    if (isNightTime(scheduledDate)) {
      const nightSurcharge = await prisma.surcharge.findFirst({
        where: { code: 'NOCTURNO' }
      })
      const nightAmount = nightSurcharge?.price || 35000
      surcharges.push({ item: 'Recargo nocturno (6PM - 6AM)', amount: nightAmount })
    }

    // Weekend/holiday surcharge
    if (isWeekendOrHoliday(scheduledDate)) {
      const weekendSurcharge = await prisma.surcharge.findFirst({
        where: { code: 'DOMINICAL_FESTIVO' }
      })
      const weekendAmount = weekendSurcharge?.price || 35000
      surcharges.push({ item: 'Recargo domingo/festivo', amount: weekendAmount })
    }

    // Calculate total
    const surchargeTotal = surcharges.reduce((sum, s) => sum + s.amount, 0)
    const total = basePrice + surchargeTotal

    return NextResponse.json({
      zone: zoneName,
      zoneSlug: pricingZone,
      isOutOfCity,
      equipmentType,
      tripType,
      breakdown,
      surcharges,
      basePrice,
      surchargeTotal,
      total
    })

  } catch (error) {
    console.error('Calculate price error:', error)
    return NextResponse.json(
      { error: 'Error al calcular precio' },
      { status: 500 }
    )
  }
}
