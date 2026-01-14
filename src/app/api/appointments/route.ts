import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PricingEngine } from '@/domain/pricing/priceQuote'
import { DistanceCalculator } from '@/domain/maps/distanceCalculator'
import type { QuoteRequest } from '@/domain/pricing/types'
import { z } from 'zod'

const CreateAppointmentSchema = z.object({
  serviceId: z.string().cuid(),
  customer: z.object({
    name: z.string().min(2),
    email: z.string().email().optional(),
    phone: z.string().min(10),
    document: z.string().optional()
  }),
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    zoneId: z.string().optional()
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    zoneId: z.string().optional()
  }),
  scheduledAt: z.string().datetime(),
  extras: z.object({
    roboticChair: z.boolean().optional(),
    floors: z.number().int().min(0).optional(),
    waitingHours: z.number().min(0).optional(),
    wheelchairHours: z.number().min(0).optional()
  }).optional(),
  notes: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const appointmentData = CreateAppointmentSchema.parse(body)

    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const distanceCalculator = new DistanceCalculator(apiKey)
    const pricingEngine = new PricingEngine()

    const { distanceKm, durationMinutes } = await distanceCalculator.calculateDistance(
      appointmentData.origin,
      appointmentData.destination
    )

    const quoteRequest: QuoteRequest = {
      serviceId: appointmentData.serviceId,
      origin: appointmentData.origin,
      destination: appointmentData.destination,
      datetimeISO: appointmentData.scheduledAt,
      extras: appointmentData.extras
    }

    const quote = await pricingEngine.calculateQuote(
      quoteRequest,
      distanceKm,
      durationMinutes
    )

    let customer = await db.customer.findUnique({
      where: { email: appointmentData.customer.email }
    })

    if (!customer) {
      customer = await db.customer.create({
        data: appointmentData.customer
      })
    }

    const appointment = await db.appointment.create({
      data: {
        serviceId: appointmentData.serviceId,
        customerId: customer.id,
        originAddress: appointmentData.origin.address,
        originLat: appointmentData.origin.lat,
        originLng: appointmentData.origin.lng,
        destinationAddress: appointmentData.destination.address,
        destinationLat: appointmentData.destination.lat,
        destinationLng: appointmentData.destination.lng,
        scheduledAt: new Date(appointmentData.scheduledAt),
        estimatedDuration: durationMinutes,
        distanceKm: distanceKm,
        pricingSnapshot: JSON.stringify(quote),
        totalAmount: quote.total,
        notes: appointmentData.notes
      },
      include: {
        service: true,
        customer: true,
        staff: true,
        resource: true
      }
    })

    return NextResponse.json(appointment, { status: 201 })

  } catch (error) {
    console.error('Appointment creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error creating appointment'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const includeAll = searchParams.get('include') === 'all'

    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (customerId) {
      where.customerId = customerId
    }

    const appointments = await db.appointment.findMany({
      where,
      include: {
        service: true,
        customer: true,
        staff: true,
        resource: true
      },
      orderBy: {
        scheduledAt: includeAll ? 'asc' : 'desc'
      },
      ...(includeAll ? {} : {
        skip: (page - 1) * limit,
        take: limit
      })
    })

    const total = await db.appointment.count({ where })

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Error fetching appointments' },
      { status: 500 }
    )
  }
}