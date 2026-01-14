import { PricingEngine } from '../priceQuote'
import { ZoneDetector } from '../zoneDetector'
import { SurchargeCalculator } from '../surchargeCalculator'
import type { QuoteRequest } from '../types'

jest.mock('../zoneDetector')
jest.mock('../surchargeCalculator')
jest.mock('@/lib/db', () => ({
  db: {
    service: {
      findFirst: jest.fn()
    },
    routeRule: {
      findMany: jest.fn()
    },
    tariffRule: {
      findFirst: jest.fn()
    }
  }
}))

const mockZoneDetector = ZoneDetector as jest.MockedClass<typeof ZoneDetector>
const mockSurchargeCalculator = SurchargeCalculator as jest.MockedClass<typeof SurchargeCalculator>

describe('PricingEngine', () => {
  let pricingEngine: PricingEngine
  let mockZoneDetectorInstance: jest.Mocked<ZoneDetector>
  let mockSurchargeCalculatorInstance: jest.Mocked<SurchargeCalculator>

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockZoneDetectorInstance = {
      detectZones: jest.fn()
    } as any
    
    mockSurchargeCalculatorInstance = {
      calculateSurcharges: jest.fn()
    } as any

    mockZoneDetector.mockImplementation(() => mockZoneDetectorInstance)
    mockSurchargeCalculator.mockImplementation(() => mockSurchargeCalculatorInstance)
    
    pricingEngine = new PricingEngine()
  })

  const sampleRequest: QuoteRequest = {
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

  describe('calculateQuote', () => {
    it('should calculate fixed price quote correctly', async () => {
      const { db } = require('@/lib/db')
      
      db.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Transporte Estándar',
        isActive: true
      })

      mockZoneDetectorInstance.detectZones.mockResolvedValue({
        originZoneId: 'zone-medellin',
        destinationZoneId: 'zone-envigado'
      })

      db.routeRule.findMany.mockResolvedValue([
        {
          id: 'route-1',
          name: 'Medellín → Envigado',
          originZoneId: 'zone-medellin',
          destinationZoneId: 'zone-envigado',
          routeType: 'MEDELLIN_TO_MUNICIPIO',
          priority: 10,
          isActive: true,
          originZone: { name: 'Medellín' },
          destinationZone: { name: 'Envigado' }
        }
      ])

      db.tariffRule.findFirst.mockResolvedValue({
        id: 'tariff-1',
        routeRuleId: 'route-1',
        serviceId: 'service-1',
        pricingMode: 'FIXED',
        fixedPrice: 35000,
        isActive: true,
        distanceTiers: []
      })

      mockSurchargeCalculatorInstance.calculateSurcharges.mockResolvedValue([])

      const quote = await pricingEngine.calculateQuote(sampleRequest, 8.5, 25)

      expect(quote).toEqual({
        currency: 'COP',
        distanceKm: 8.5,
        durationMinutes: 25,
        baseFare: 35000,
        appliedRule: {
          routeRuleId: 'route-1',
          tariffRuleId: 'tariff-1',
          pricingMode: 'FIXED',
          explanation: expect.stringContaining('Ruta: Medellín → Envigado')
        },
        surcharges: [],
        total: 35000
      })
    })

    it('should calculate per-km price with minimum', async () => {
      const { db } = require('@/lib/db')
      
      db.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Transporte Estándar',
        isActive: true
      })

      mockZoneDetectorInstance.detectZones.mockResolvedValue({
        originZoneId: 'zone-medellin',
        destinationZoneId: 'zone-medellin'
      })

      db.routeRule.findMany.mockResolvedValue([
        {
          id: 'route-intra',
          name: 'Dentro de Medellín',
          originZoneId: 'zone-medellin',
          destinationZoneId: 'zone-medellin',
          routeType: 'INTRA_ZONE',
          priority: 10,
          isActive: true,
          originZone: { name: 'Medellín' },
          destinationZone: { name: 'Medellín' }
        }
      ])

      db.tariffRule.findFirst.mockResolvedValue({
        id: 'tariff-per-km',
        routeRuleId: 'route-intra',
        serviceId: 'service-1',
        pricingMode: 'PER_KM',
        pricePerKm: 4500,
        minPrice: 25000,
        isActive: true,
        distanceTiers: []
      })

      mockSurchargeCalculatorInstance.calculateSurcharges.mockResolvedValue([])

      const quote = await pricingEngine.calculateQuote(sampleRequest, 3.0, 15)
      const expectedPrice = Math.max(3.0 * 4500, 25000)

      expect(quote.baseFare).toBe(expectedPrice)
      expect(quote.total).toBe(expectedPrice)
    })

    it('should calculate distance tier pricing', async () => {
      const { db } = require('@/lib/db')
      
      db.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Transporte Estándar',
        isActive: true
      })

      mockZoneDetectorInstance.detectZones.mockResolvedValue({
        originZoneId: 'zone-envigado',
        destinationZoneId: 'zone-itagui'
      })

      db.routeRule.findMany.mockResolvedValue([
        {
          id: 'route-between',
          name: 'Entre Municipios',
          originZoneId: null,
          destinationZoneId: null,
          routeType: 'OUTSIDE_GENERIC',
          priority: 5,
          isActive: true,
          originZone: null,
          destinationZone: null
        }
      ])

      db.tariffRule.findFirst.mockResolvedValue({
        id: 'tariff-tier',
        routeRuleId: 'route-between',
        serviceId: 'service-1',
        pricingMode: 'BY_DISTANCE_TIER',
        isActive: true,
        distanceTiers: [
          { id: '1', minKm: 0, maxKm: 5, price: 25000 },
          { id: '2', minKm: 5, maxKm: 10, price: 35000 },
          { id: '3', minKm: 10, maxKm: 20, price: 45000 },
          { id: '4', minKm: 20, maxKm: null, price: 65000 }
        ]
      })

      mockSurchargeCalculatorInstance.calculateSurcharges.mockResolvedValue([])

      const quote = await pricingEngine.calculateQuote(sampleRequest, 7.5, 20)

      expect(quote.baseFare).toBe(35000)
      expect(quote.total).toBe(35000)
    })

    it('should apply surcharges correctly', async () => {
      const { db } = require('@/lib/db')
      
      db.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Transporte Estándar',
        isActive: true
      })

      mockZoneDetectorInstance.detectZones.mockResolvedValue({
        originZoneId: 'zone-medellin',
        destinationZoneId: 'zone-medellin'
      })

      db.routeRule.findMany.mockResolvedValue([
        {
          id: 'route-intra',
          name: 'Dentro de Medellín',
          originZoneId: 'zone-medellin',
          destinationZoneId: 'zone-medellin',
          routeType: 'INTRA_ZONE',
          priority: 10,
          isActive: true,
          originZone: { name: 'Medellín' },
          destinationZone: { name: 'Medellín' }
        }
      ])

      db.tariffRule.findFirst.mockResolvedValue({
        id: 'tariff-1',
        routeRuleId: 'route-intra',
        serviceId: 'service-1',
        pricingMode: 'FIXED',
        fixedPrice: 30000,
        isActive: true,
        distanceTiers: []
      })

      mockSurchargeCalculatorInstance.calculateSurcharges.mockResolvedValue([
        {
          id: 'surcharge-1',
          name: 'Recargo Nocturno',
          type: 'NIGHT',
          amount: 6000,
          details: 'Servicio nocturno'
        },
        {
          id: 'surcharge-2',
          name: 'Silla Robótica',
          type: 'ROBOTIC_CHAIR',
          amount: 25000,
          details: 'Silla robótica'
        }
      ])

      const nightRequest: QuoteRequest = {
        ...sampleRequest,
        datetimeISO: '2024-03-15T21:00:00.000Z',
        extras: {
          roboticChair: true
        }
      }

      const quote = await pricingEngine.calculateQuote(nightRequest, 5.0, 15)

      expect(quote.baseFare).toBe(30000)
      expect(quote.surcharges).toHaveLength(2)
      expect(quote.total).toBe(30000 + 6000 + 25000)
    })

    it('should throw error when service not found', async () => {
      const { db } = require('@/lib/db')
      
      db.service.findFirst.mockResolvedValue(null)

      await expect(
        pricingEngine.calculateQuote(sampleRequest, 5.0, 15)
      ).rejects.toThrow('Servicio no encontrado o inactivo')
    })

    it('should throw error when no route rule matches', async () => {
      const { db } = require('@/lib/db')
      
      db.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Transporte Estándar',
        isActive: true
      })

      mockZoneDetectorInstance.detectZones.mockResolvedValue({
        originZoneId: 'zone-unknown',
        destinationZoneId: 'zone-unknown'
      })

      db.routeRule.findMany.mockResolvedValue([])

      await expect(
        pricingEngine.calculateQuote(sampleRequest, 5.0, 15)
      ).rejects.toThrow('No se encontró una regla de ruta aplicable')
    })

    it('should throw error when no tariff rule found', async () => {
      const { db } = require('@/lib/db')
      
      db.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Transporte Estándar',
        isActive: true
      })

      mockZoneDetectorInstance.detectZones.mockResolvedValue({
        originZoneId: 'zone-medellin',
        destinationZoneId: 'zone-envigado'
      })

      db.routeRule.findMany.mockResolvedValue([
        {
          id: 'route-1',
          originZoneId: 'zone-medellin',
          destinationZoneId: 'zone-envigado',
          routeType: 'MEDELLIN_TO_MUNICIPIO',
          priority: 10,
          isActive: true,
          originZone: { name: 'Medellín' },
          destinationZone: { name: 'Envigado' }
        }
      ])

      db.tariffRule.findFirst.mockResolvedValue(null)

      await expect(
        pricingEngine.calculateQuote(sampleRequest, 5.0, 15)
      ).rejects.toThrow('No se encontró tarifa para el servicio')
    })
  })

  describe('route rule priority', () => {
    it('should select route rule with highest priority', async () => {
      const { db } = require('@/lib/db')
      
      db.service.findFirst.mockResolvedValue({
        id: 'service-1',
        name: 'Transporte Estándar',
        isActive: true
      })

      mockZoneDetectorInstance.detectZones.mockResolvedValue({
        originZoneId: 'zone-medellin',
        destinationZoneId: 'zone-envigado'
      })

      db.routeRule.findMany.mockResolvedValue([
        {
          id: 'route-generic',
          name: 'Genérica',
          originZoneId: null,
          destinationZoneId: null,
          routeType: 'OUTSIDE_GENERIC',
          priority: 1,
          isActive: true,
          originZone: null,
          destinationZone: null
        },
        {
          id: 'route-specific',
          name: 'Medellín → Envigado',
          originZoneId: 'zone-medellin',
          destinationZoneId: 'zone-envigado',
          routeType: 'MEDELLIN_TO_MUNICIPIO',
          priority: 10,
          isActive: true,
          originZone: { name: 'Medellín' },
          destinationZone: { name: 'Envigado' }
        }
      ])

      db.tariffRule.findFirst.mockImplementation((query) => {
        const routeRuleId = query.where.routeRuleId
        if (routeRuleId === 'route-specific') {
          return Promise.resolve({
            id: 'tariff-specific',
            routeRuleId: 'route-specific',
            serviceId: 'service-1',
            pricingMode: 'FIXED',
            fixedPrice: 35000,
            isActive: true,
            distanceTiers: []
          })
        }
        return Promise.resolve(null)
      })

      mockSurchargeCalculatorInstance.calculateSurcharges.mockResolvedValue([])

      const quote = await pricingEngine.calculateQuote(sampleRequest, 8.0, 25)

      expect(quote.appliedRule.routeRuleId).toBe('route-specific')
      expect(quote.baseFare).toBe(35000)
    })
  })
})