import type { PricingMode, SurchargeType, AmountType } from '@prisma/client'

export interface Location {
  lat: number
  lng: number
  address: string
  zoneId?: string
}

export interface QuoteRequest {
  serviceId: string
  origin: Location
  destination: Location
  datetimeISO: string
  extras?: {
    roboticChair?: boolean
    floors?: number
    waitingHours?: number
    wheelchairHours?: number
    [key: string]: any
  }
}

export interface AppliedSurcharge {
  id: string
  name: string
  type: SurchargeType
  amount: number
  details?: string
}

export interface AppliedTariffRule {
  zoneId: string | null
  tariffRuleId: string | null
  pricingMode: string
  explanation: string
}

export interface PriceQuote {
  currency: string
  distanceKm: number
  durationMinutes: number
  baseFare: number
  appliedRule: AppliedTariffRule
  surcharges: AppliedSurcharge[]
  total: number
}

export interface SurchargeCondition {
  timeRanges?: Array<{
    start: string // HH:mm format
    end: string   // HH:mm format
  }>
  daysOfWeek?: number[] // 0=Sunday, 1=Monday, etc.
  holidays?: boolean
}

export class PricingError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'PricingError'
  }
}

export const PRICING_ERRORS = {
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  NO_ROUTE_RULE: 'NO_ROUTE_RULE',
  NO_TARIFF_RULE: 'NO_TARIFF_RULE',
  INVALID_DISTANCE_TIER: 'INVALID_DISTANCE_TIER',
  MISSING_PRICING_DATA: 'MISSING_PRICING_DATA',
  ZONE_DETECTION_FAILED: 'ZONE_DETECTION_FAILED'
} as const