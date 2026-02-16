import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CalculateBookingSchema = z.object({
  originAddress: z.string().min(1, 'Dirección de origen es requerida'),
  destinationAddress: z.string().min(1, 'Dirección de destino es requerida'),
  equipmentType: z.string().min(1, 'Tipo de equipo es requerido'),
  tripType: z.string().min(1, 'Tipo de viaje es requerido'),
  scheduledAt: z.string().optional().nullable(),
})

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
    const parsed = CalculateBookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { originAddress, destinationAddress, equipmentType, tripType, scheduledAt } = parsed.data

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : new Date()

    // Detect zones
    const originDetection = detectZoneFromAddress(originAddress)
    const destDetection = detectZoneFromAddress(destinationAddress)

    // Determine pricing zone:
    // - If out-of-city, use that
    // - If one is Medellín and the other is peripheral, use the peripheral zone
    // - Otherwise use whichever is detected
    let pricingZone: string
    const isOutOfCity = destDetection.isOutOfCity || originDetection.isOutOfCity

    if (isOutOfCity) {
      pricingZone = 'fuera-ciudad'
    } else if (originDetection.zone === 'medellin' && destDetection.zone && destDetection.zone !== 'medellin') {
      pricingZone = destDetection.zone
    } else if (destDetection.zone === 'medellin' && originDetection.zone && originDetection.zone !== 'medellin') {
      pricingZone = originDetection.zone
    } else {
      pricingZone = originDetection.zone || destDetection.zone || 'medellin'
    }

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
        return NextResponse.json(
          { error: 'No se encontró tarifa para destino fuera de ciudad' },
          { status: 404 }
        )
      }
      breakdown.push({ item: `Ruta ${zoneName} (${tripType === 'DOBLE' ? 'Ida y vuelta' : 'Solo ida'})`, amount: basePrice })
    } else {
      // Get zone and rate
      const zone = await prisma.zone.findFirst({
        where: { slug: pricingZone }
      })

      if (!zone) {
        return NextResponse.json(
          { error: `No se encontró la zona: ${pricingZone}` },
          { status: 404 }
        )
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
          return NextResponse.json(
            { error: `No se encontró tarifa para la zona ${zone.name} con equipo ${equipmentType}` },
            { status: 404 }
          )
        }
        zoneName = zone.name
      }
      const equipLabels: Record<string, string> = { 'RAMPA': 'Rampa', 'ROBOTICA_PLEGABLE': 'Silla Robótica' }
      const equipName = equipLabels[equipmentType] || equipmentType.charAt(0).toUpperCase() + equipmentType.slice(1).toLowerCase().replace(/_/g, ' ')
      breakdown.push({ item: `Servicio ${equipName} - ${zoneName}`, amount: basePrice })
    }

    // Calculate surcharges
    let surcharges: { item: string, amount: number }[] = []

    // Night surcharge
    if (isNightTime(scheduledDate)) {
      const nightSurcharge = await prisma.surcharge.findFirst({
        where: { code: 'NOCTURNO' }
      })
      if (nightSurcharge) {
        surcharges.push({ item: nightSurcharge.name || 'Recargo nocturno (6PM - 6AM)', amount: nightSurcharge.price })
      }
    }

    // Weekend/holiday surcharge
    if (isWeekendOrHoliday(scheduledDate)) {
      const weekendSurcharge = await prisma.surcharge.findFirst({
        where: { code: 'DOMINICAL_FESTIVO' }
      })
      if (weekendSurcharge) {
        surcharges.push({ item: weekendSurcharge.name || 'Recargo domingo/festivo', amount: weekendSurcharge.price })
      }
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
