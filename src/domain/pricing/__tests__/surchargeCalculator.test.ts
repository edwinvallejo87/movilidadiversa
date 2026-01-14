import { SurchargeCalculator } from '../surchargeCalculator'
import type { QuoteRequest } from '../types'

jest.mock('@/lib/db', () => ({
  db: {
    surchargeRule: {
      findMany: jest.fn()
    },
    holiday: {
      findFirst: jest.fn()
    }
  }
}))

describe('SurchargeCalculator', () => {
  let calculator: SurchargeCalculator
  const { db } = require('@/lib/db')

  beforeEach(() => {
    jest.clearAllMocks()
    calculator = new SurchargeCalculator()
  })

  const baseRequest: QuoteRequest = {
    serviceId: 'service-1',
    origin: {
      lat: 6.2442,
      lng: -75.5812,
      address: 'El Poblado, Medellín'
    },
    destination: {
      lat: 6.1701,
      lng: -75.5906,
      address: 'Envigado Centro'
    },
    datetimeISO: '2024-03-15T14:00:00.000Z'
  }

  describe('night surcharge', () => {
    beforeEach(() => {
      db.surchargeRule.findMany.mockResolvedValue([
        {
          id: 'surcharge-night',
          name: 'Recargo Nocturno',
          type: 'NIGHT',
          amountType: 'PERCENTAGE',
          amount: 20,
          conditionJson: {
            timeRanges: [{ start: '19:00', end: '06:00' }]
          },
          isActive: true
        }
      ])
    })

    it('should apply night surcharge for evening time', async () => {
      const nightRequest = {
        ...baseRequest,
        datetimeISO: '2024-03-15T21:00:00.000Z'
      }

      const surcharges = await calculator.calculateSurcharges(nightRequest, 30000)

      expect(surcharges).toHaveLength(1)
      expect(surcharges[0]).toMatchObject({
        id: 'surcharge-night',
        name: 'Recargo Nocturno',
        type: 'NIGHT',
        amount: 6000
      })
    })

    it('should apply night surcharge for early morning', async () => {
      const earlyMorningRequest = {
        ...baseRequest,
        datetimeISO: '2024-03-15T05:00:00.000Z'
      }

      const surcharges = await calculator.calculateSurcharges(earlyMorningRequest, 25000)

      expect(surcharges).toHaveLength(1)
      expect(surcharges[0].amount).toBe(5000)
    })

    it('should not apply night surcharge for day time', async () => {
      const dayRequest = {
        ...baseRequest,
        datetimeISO: '2024-03-15T14:00:00.000Z'
      }

      const surcharges = await calculator.calculateSurcharges(dayRequest, 30000)

      expect(surcharges).toHaveLength(0)
    })
  })

  describe('sunday and holiday surcharge', () => {
    beforeEach(() => {
      db.surchargeRule.findMany.mockResolvedValue([
        {
          id: 'surcharge-sunday',
          name: 'Recargo Domingo/Festivo',
          type: 'SUNDAY_OR_HOLIDAY',
          amountType: 'PERCENTAGE',
          amount: 15,
          isActive: true
        }
      ])
    })

    it('should apply surcharge on Sunday', async () => {
      const sundayRequest = {
        ...baseRequest,
        datetimeISO: '2024-03-17T14:00:00.000Z'
      }

      db.holiday.findFirst.mockResolvedValue(null)

      const surcharges = await calculator.calculateSurcharges(sundayRequest, 40000)

      expect(surcharges).toHaveLength(1)
      expect(surcharges[0]).toMatchObject({
        id: 'surcharge-sunday',
        name: 'Recargo Domingo/Festivo',
        type: 'SUNDAY_OR_HOLIDAY',
        amount: 6000
      })
    })

    it('should apply surcharge on holiday', async () => {
      const holidayRequest = {
        ...baseRequest,
        datetimeISO: '2024-07-20T14:00:00.000Z'
      }

      db.holiday.findFirst.mockResolvedValue({
        id: 'holiday-independence',
        name: 'Día de la Independencia',
        date: new Date('2024-07-20'),
        isActive: true
      })

      const surcharges = await calculator.calculateSurcharges(holidayRequest, 50000)

      expect(surcharges).toHaveLength(1)
      expect(surcharges[0].amount).toBe(7500)
    })

    it('should not apply surcharge on regular weekday', async () => {
      const weekdayRequest = {
        ...baseRequest,
        datetimeISO: '2024-03-15T14:00:00.000Z'
      }

      db.holiday.findFirst.mockResolvedValue(null)

      const surcharges = await calculator.calculateSurcharges(weekdayRequest, 30000)

      expect(surcharges).toHaveLength(0)
    })
  })

  describe('robotic chair surcharge', () => {
    beforeEach(() => {
      db.surchargeRule.findMany.mockResolvedValue([
        {
          id: 'surcharge-robotic',
          name: 'Silla Robótica',
          type: 'ROBOTIC_CHAIR',
          amountType: 'FIXED',
          amount: 25000,
          isActive: true
        }
      ])
    })

    it('should apply robotic chair surcharge when requested', async () => {
      const roboticRequest = {
        ...baseRequest,
        extras: {
          roboticChair: true
        }
      }

      const surcharges = await calculator.calculateSurcharges(roboticRequest, 30000)

      expect(surcharges).toHaveLength(1)
      expect(surcharges[0]).toMatchObject({
        id: 'surcharge-robotic',
        name: 'Silla Robótica',
        type: 'ROBOTIC_CHAIR',
        amount: 25000
      })
    })

    it('should not apply robotic chair surcharge when not requested', async () => {
      const surcharges = await calculator.calculateSurcharges(baseRequest, 30000)

      expect(surcharges).toHaveLength(0)
    })
  })

  describe('floor surcharge', () => {
    beforeEach(() => {
      db.surchargeRule.findMany.mockResolvedValue([
        {
          id: 'surcharge-floor',
          name: 'Piso Adicional',
          type: 'FLOOR_OVER_3',
          amountType: 'PER_UNIT',
          amount: 8000,
          unitLabel: 'piso',
          isActive: true
        }
      ])
    })

    it('should apply floor surcharge for floors over 3', async () => {
      const floorRequest = {
        ...baseRequest,
        extras: {
          floors: 6
        }
      }

      const surcharges = await calculator.calculateSurcharges(floorRequest, 30000)

      expect(surcharges).toHaveLength(1)
      expect(surcharges[0]).toMatchObject({
        id: 'surcharge-floor',
        name: 'Piso Adicional',
        type: 'FLOOR_OVER_3',
        amount: 24000,
        details: '3 pisos adicionales'
      })
    })

    it('should not apply floor surcharge for 3 floors or less', async () => {
      const floorRequest = {
        ...baseRequest,
        extras: {
          floors: 3
        }
      }

      const surcharges = await calculator.calculateSurcharges(floorRequest, 30000)

      expect(surcharges).toHaveLength(0)
    })
  })

  describe('waiting hours surcharge', () => {
    beforeEach(() => {
      db.surchargeRule.findMany.mockResolvedValue([
        {
          id: 'surcharge-waiting',
          name: 'Tiempo de Espera',
          type: 'WAITING_HOUR',
          amountType: 'PER_UNIT',
          amount: 15000,
          unitLabel: 'hora',
          isActive: true
        }
      ])
    })

    it('should apply waiting hours surcharge', async () => {
      const waitingRequest = {
        ...baseRequest,
        extras: {
          waitingHours: 2.5
        }
      }

      const surcharges = await calculator.calculateSurcharges(waitingRequest, 30000)

      expect(surcharges).toHaveLength(1)
      expect(surcharges[0]).toMatchObject({
        id: 'surcharge-waiting',
        name: 'Tiempo de Espera',
        type: 'WAITING_HOUR',
        amount: 37500,
        details: '2.5 horas de espera'
      })
    })

    it('should not apply waiting hours surcharge when zero', async () => {
      const waitingRequest = {
        ...baseRequest,
        extras: {
          waitingHours: 0
        }
      }

      const surcharges = await calculator.calculateSurcharges(waitingRequest, 30000)

      expect(surcharges).toHaveLength(0)
    })
  })

  describe('multiple surcharges', () => {
    beforeEach(() => {
      db.surchargeRule.findMany.mockResolvedValue([
        {
          id: 'surcharge-night',
          name: 'Recargo Nocturno',
          type: 'NIGHT',
          amountType: 'PERCENTAGE',
          amount: 20,
          conditionJson: {
            timeRanges: [{ start: '19:00', end: '06:00' }]
          },
          isActive: true
        },
        {
          id: 'surcharge-robotic',
          name: 'Silla Robótica',
          type: 'ROBOTIC_CHAIR',
          amountType: 'FIXED',
          amount: 25000,
          isActive: true
        },
        {
          id: 'surcharge-waiting',
          name: 'Tiempo de Espera',
          type: 'WAITING_HOUR',
          amountType: 'PER_UNIT',
          amount: 15000,
          unitLabel: 'hora',
          isActive: true
        }
      ])
    })

    it('should apply multiple applicable surcharges', async () => {
      const complexRequest = {
        ...baseRequest,
        datetimeISO: '2024-03-15T20:00:00.000Z',
        extras: {
          roboticChair: true,
          waitingHours: 1
        }
      }

      const surcharges = await calculator.calculateSurcharges(complexRequest, 40000)

      expect(surcharges).toHaveLength(3)
      
      const nightSurcharge = surcharges.find(s => s.type === 'NIGHT')
      const roboticSurcharge = surcharges.find(s => s.type === 'ROBOTIC_CHAIR')
      const waitingSurcharge = surcharges.find(s => s.type === 'WAITING_HOUR')

      expect(nightSurcharge?.amount).toBe(8000)
      expect(roboticSurcharge?.amount).toBe(25000)
      expect(waitingSurcharge?.amount).toBe(15000)

      const totalSurcharges = surcharges.reduce((sum, s) => sum + s.amount, 0)
      expect(totalSurcharges).toBe(48000)
    })
  })
})