import { db } from '@/lib/db'
import { ZoneDetector } from './zoneDetector'
import { SurchargeCalculator } from './surchargeCalculator'
import type { 
  QuoteRequest, 
  PriceQuote, 
  AppliedTariffRule 
} from './types'

export class PricingEngine {
  private zoneDetector = new ZoneDetector()
  private surchargeCalculator = new SurchargeCalculator()

  async calculateQuote(
    request: QuoteRequest,
    distanceKm: number,
    durationMinutes: number
  ): Promise<PriceQuote> {
    const service = await db.service.findFirst({
      where: { id: request.serviceId, isActive: true }
    })

    if (!service) {
      throw new Error('Servicio no encontrado o inactivo')
    }

    const { fromZoneId, toZoneId } = await this.zoneDetector.detectZones(
      request.origin,
      request.destination
    )

    // Buscar tarifa específica para la zona de origen y el servicio
    const tariffRule = await db.tariffRule.findFirst({
      where: {
        zoneId: fromZoneId,
        serviceId: service.id,
        isActive: true
      },
      include: {
        distanceTiers: {
          orderBy: { minKm: 'asc' }
        }
      }
    })

    // Buscar zona base para tarifas por defecto
    const baseZone = await db.zone.findFirst({
      where: { id: fromZoneId }
    })

    // Calcular precio base
    let baseFare = 0
    let pricingMode = 'FIXED'
    
    if (tariffRule) {
      baseFare = this.calculateBasePriceFromRule(tariffRule, distanceKm)
      pricingMode = tariffRule.pricingMode
    } else if (baseZone) {
      baseFare = baseZone.baseFare + (baseZone.perKmRate * distanceKm)
      pricingMode = 'PER_KM'
    } else {
      // Tarifa de emergencia básica
      baseFare = 5000 + (1000 * distanceKm)
      pricingMode = 'EMERGENCY'
    }

    const appliedRule: AppliedTariffRule = {
      zoneId: fromZoneId,
      tariffRuleId: tariffRule?.id || null,
      pricingMode,
      explanation: this.getExplanation(pricingMode, distanceKm, baseFare)
    }

    const surcharges = await this.surchargeCalculator.calculateSurcharges(
      request,
      baseFare
    )

    const surchargeTotal = surcharges.reduce((sum, s) => sum + s.amount, 0)
    const total = baseFare + surchargeTotal

    return {
      currency: 'COP',
      distanceKm,
      durationMinutes,
      baseFare,
      appliedRule,
      surcharges,
      total
    }
  }

  private calculateBasePriceFromRule(tariffRule: any, distanceKm: number): number {
    switch (tariffRule.pricingMode) {
      case 'FIXED':
        return tariffRule.fixedPrice || 0

      case 'PER_KM':
        return (tariffRule.pricePerKm || 0) * distanceKm

      case 'BY_DISTANCE_TIER':
        const applicableTier = tariffRule.distanceTiers.find((tier: any) => 
          distanceKm >= tier.minKm && 
          (tier.maxKm === null || distanceKm <= tier.maxKm)
        )
        return applicableTier?.price || 0

      default:
        return 0
    }
  }

  private getExplanation(pricingMode: string, distanceKm: number, baseFare: number): string {
    switch (pricingMode) {
      case 'FIXED':
        return `Tarifa fija: $${baseFare.toLocaleString()}`
      
      case 'PER_KM':
        return `Tarifa por kilómetro (${distanceKm.toFixed(1)} km): $${baseFare.toLocaleString()}`
      
      case 'BY_DISTANCE_TIER':
        return `Tarifa por tramo de distancia (${distanceKm.toFixed(1)} km): $${baseFare.toLocaleString()}`
      
      case 'EMERGENCY':
        return `Tarifa de emergencia (${distanceKm.toFixed(1)} km): $${baseFare.toLocaleString()}`
      
      default:
        return `Tarifa calculada: $${baseFare.toLocaleString()}`
    }
  }
}