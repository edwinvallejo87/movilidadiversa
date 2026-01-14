import { NextRequest, NextResponse } from 'next/server'
import { PricingEngine } from '@/domain/pricing/priceQuote'
import { DistanceCalculator } from '@/domain/maps/distanceCalculator'
import type { QuoteRequest } from '@/domain/pricing/types'
import { z } from 'zod'

const QuoteRequestSchema = z.object({
  serviceId: z.string().cuid(),
  origin: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }),
  destination: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }),
  datetimeISO: z.string().datetime(),
  extras: z.object({
    roboticChair: z.boolean().optional(),
    floors: z.number().int().min(0).optional(),
    waitingHours: z.number().min(0).optional(),
    wheelchairHours: z.number().min(0).optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const quoteData = QuoteRequestSchema.parse(body)

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
      quoteData.origin,
      quoteData.destination
    )

    const quote = await pricingEngine.calculateQuote(
      quoteData,
      distanceKm,
      durationMinutes
    )

    return NextResponse.json({
      ...quote,
      distanceKm,
      durationMinutes
    })

  } catch (error) {
    console.error('Quote calculation error:', error)
    
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
        error: error instanceof Error ? error.message : 'Error calculating quote'
      },
      { status: 500 }
    )
  }
}