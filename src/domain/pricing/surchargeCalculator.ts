import { db } from '@/lib/db'
import type { SurchargeType, AmountType } from '@prisma/client'
import type { AppliedSurcharge, SurchargeCondition, QuoteRequest } from './types'

export class SurchargeCalculator {
  async calculateSurcharges(
    request: QuoteRequest,
    baseFare: number
  ): Promise<AppliedSurcharge[]> {
    const surcharges = await db.surchargeRule.findMany({
      where: { isActive: true }
    })

    const appliedSurcharges: AppliedSurcharge[] = []
    const requestDate = new Date(request.datetimeISO)

    for (const surcharge of surcharges) {
      const applied = await this.evaluateSurcharge(surcharge, request, requestDate, baseFare)
      if (applied) {
        appliedSurcharges.push(applied)
      }
    }

    return appliedSurcharges
  }

  private async evaluateSurcharge(
    surcharge: any,
    request: QuoteRequest,
    requestDate: Date,
    baseFare: number
  ): Promise<AppliedSurcharge | null> {
    const conditions = surcharge.conditionJson 
      ? JSON.parse(surcharge.conditionJson) as SurchargeCondition 
      : null

    switch (surcharge.type) {
      case 'TIME_BASED':
        if (conditions && !this.isTimeConditionMet(requestDate, conditions)) {
          return null
        }
        break

      case 'EXTRA_SERVICE':
        if (!request.extras?.roboticChair && !request.extras?.waitingHours && !request.extras?.wheelchairHours) {
          return null
        }
        break

      case 'DISTANCE_BASED':
        break

      default:
        return null
    }

    const amount = this.calculateAmount(surcharge, request, baseFare)
    const details = this.getDetails(surcharge, request)

    return {
      id: surcharge.id,
      name: surcharge.name,
      type: surcharge.type,
      amount,
      details
    }
  }

  private calculateAmount(
    surcharge: any,
    request: QuoteRequest,
    baseFare: number
  ): number {
    const baseAmount = parseFloat(surcharge.amount.toString())

    switch (surcharge.amountType) {
      case 'FIXED':
        return baseAmount

      case 'PERCENTAGE':
        return baseFare * (baseAmount / 100)

      default:
        return baseAmount
    }
  }

  private getDetails(surcharge: any, request: QuoteRequest): string {
    switch (surcharge.type) {
      case 'EXTRA_SERVICE':
        const extras = []
        if (request.extras?.roboticChair) extras.push('silla robótica')
        if (request.extras?.waitingHours) extras.push(`${request.extras.waitingHours}h espera`)
        if (request.extras?.wheelchairHours) extras.push(`${request.extras.wheelchairHours}h silla de ruedas`)
        return extras.join(', ')

      case 'TIME_BASED':
        return `Recargo por horario`

      case 'DISTANCE_BASED':
        return `Recargo por distancia`

      default:
        return surcharge.name
    }
  }

  private isTimeConditionMet(date: Date, condition: SurchargeCondition): boolean {
    if (condition.timeRanges && condition.timeRanges.length > 0) {
      if (!this.isTimeInRanges(date, condition.timeRanges)) {
        return false
      }
    }

    if (condition.daysOfWeek && condition.daysOfWeek.length > 0) {
      const dayOfWeek = date.getDay()
      if (!condition.daysOfWeek.includes(dayOfWeek)) {
        return false
      }
    }

    if (condition.holidays) {
      return this.isHoliday(date)
    }

    return true
  }

  private isTimeInRanges(date: Date, timeRanges: Array<{start: string, end: string}>): boolean {
    const hour = date.getHours()
    const minute = date.getMinutes()
    const currentTime = hour * 60 + minute

    for (const range of timeRanges) {
      const [startHour, startMinute] = range.start.split(':').map(Number)
      const [endHour, endMinute] = range.end.split(':').map(Number)
      
      const startTime = startHour * 60 + startMinute
      const endTime = endHour * 60 + endMinute

      if (startTime > endTime) {
        if (currentTime >= startTime || currentTime <= endTime) {
          return true
        }
      } else {
        if (currentTime >= startTime && currentTime <= endTime) {
          return true
        }
      }
    }

    return false
  }

  private async isHoliday(date: Date): Promise<boolean> {
    const dateString = date.toISOString().split('T')[0]
    const holiday = await db.holiday.findFirst({
      where: {
        date: new Date(dateString),
        isActive: true
      }
    })

    return !!holiday
  }
}