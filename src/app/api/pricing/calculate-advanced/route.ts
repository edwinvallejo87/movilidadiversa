import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const AdvancedPricingSchema = z.object({
  originAddress: z.string(),
  destinationAddress: z.string(),
  distanceKm: z.number().min(0),
  scheduledAt: z.string().datetime(), // To calculate time-based surcharges
  floorOrigin: z.number().optional(),
  floorDestination: z.number().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originAddress, destinationAddress, distanceKm, scheduledAt, floorOrigin, floorDestination } = AdvancedPricingSchema.parse(body)

    // Convert scheduled time for surcharge calculations
    const appointmentTime = new Date(scheduledAt)
    const hour = appointmentTime.getHours()
    const dayOfWeek = appointmentTime.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Get all services that match the distance
    const services = await db.service.findMany({
      where: {
        isActive: true,
        AND: [
          // Distance filters
          {
            OR: [
              { minDistanceKm: null }, // No minimum distance
              { minDistanceKm: { lte: distanceKm } }
            ]
          },
          {
            OR: [
              { maxDistanceKm: null }, // No maximum distance  
              { maxDistanceKm: { gte: distanceKm } }
            ]
          }
        ]
      },
      orderBy: [
        { category: 'asc' },
        { minDistanceKm: 'asc' }
      ]
    })

    // Calculate pricing for each applicable service
    const serviceOptions = []

    for (const service of services) {
      let basePrice = service.basePrice || 0
      let surcharges = []
      let totalSurcharge = 0

      // Calculate time-based surcharges (nocturno: 18:00-06:00)
      if (hour >= 18 || hour < 6) {
        surcharges.push({
          name: 'Recargo Nocturno',
          amount: 35000,
          type: 'NOCTURNO'
        })
        totalSurcharge += 35000
      }

      // Calculate day-based surcharges (Domingos)
      if (dayOfWeek === 0) {
        surcharges.push({
          name: 'Recargo Dominical',
          amount: 35000,
          type: 'DOMINICAL'
        })
        totalSurcharge += 35000
      }

      // Calculate floor-based surcharges for silla robotica services
      if (service.category === 'SOLO_SILLA') {
        const maxFloor = Math.max(floorOrigin || 0, floorDestination || 0)
        if (maxFloor > 3) {
          const floorSurcharge = (maxFloor - 3) * 5000
          surcharges.push({
            name: `Recargo por Piso (${maxFloor})`,
            amount: floorSurcharge,
            type: 'FLOOR'
          })
          totalSurcharge += floorSurcharge
        }
      }

      const totalPrice = basePrice + totalSurcharge

      serviceOptions.push({
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          category: service.category,
          color: service.color,
          durationMinutes: service.durationMinutes,
          requiresVehicle: service.requiresVehicle
        },
        pricing: {
          basePrice,
          surcharges,
          totalSurcharge,
          totalPrice
        },
        applicable: true,
        distanceRange: {
          min: service.minDistanceKm,
          max: service.maxDistanceKm
        }
      })
    }

    // Sort by price (cheapest first) and then by category preference
    serviceOptions.sort((a, b) => {
      // First sort by total price
      if (a.pricing.totalPrice !== b.pricing.totalPrice) {
        return a.pricing.totalPrice - b.pricing.totalPrice
      }
      
      // Then by category preference (SENCILLO < DOBLE < ROBOTICA_PLEGABLE)
      const categoryOrder = ['SENCILLO', 'DOBLE', 'ROBOTICA_PLEGABLE', 'SOLO_SILLA', 'ESPERA', 'RUEDAS_CONVENCIONAL', 'SOLO_RUEDAS']
      const aOrder = categoryOrder.indexOf(a.service.category) 
      const bOrder = categoryOrder.indexOf(b.service.category)
      
      return aOrder - bOrder
    })

    return NextResponse.json({
      distanceKm,
      appointmentDateTime: appointmentTime,
      serviceOptions,
      recommendedService: serviceOptions[0] || null,
      summary: {
        totalOptions: serviceOptions.length,
        priceRange: {
          min: Math.min(...serviceOptions.map(s => s.pricing.totalPrice)),
          max: Math.max(...serviceOptions.map(s => s.pricing.totalPrice))
        }
      }
    })

  } catch (error) {
    console.error('Error calculating advanced pricing:', error)
    
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
      { error: 'Error al calcular precios' },
      { status: 500 }
    )
  }
}