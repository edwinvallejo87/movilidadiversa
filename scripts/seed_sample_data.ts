import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedSampleData() {
  console.log('🌱 Iniciando siembra de datos de muestra...')

  try {
    console.log('📋 Creando servicios...')
    const services = await Promise.all([
      prisma.service.upsert({
        where: { name: 'Transporte Estándar' },
        update: {},
        create: {
          name: 'Transporte Estándar',
          description: 'Servicio de transporte con vehículos adaptados',
          durationMinutes: 60,
          isActive: true
        }
      }),
      prisma.service.upsert({
        where: { name: 'Silla Robótica' },
        update: {},
        create: {
          name: 'Silla Robótica',
          description: 'Servicio especializado con silla robótica para escaleras',
          durationMinutes: 90,
          isActive: true
        }
      }),
      prisma.service.upsert({
        where: { name: 'Traslado Médico' },
        update: {},
        create: {
          name: 'Traslado Médico',
          description: 'Transporte especializado para citas médicas',
          durationMinutes: 120,
          isActive: true
        }
      })
    ])
    console.log('✅ Servicios creados')

    console.log('🗺️  Creando zonas...')
    const zones = await Promise.all([
      prisma.zone.upsert({
        where: { name: 'Medellín' },
        update: {},
        create: {
          name: 'Medellín',
          type: 'CITY',
          isActive: true
        }
      }),
      prisma.zone.upsert({
        where: { name: 'Envigado' },
        update: {},
        create: {
          name: 'Envigado',
          type: 'MUNICIPALITY',
          isActive: true
        }
      }),
      prisma.zone.upsert({
        where: { name: 'Itagüí' },
        update: {},
        create: {
          name: 'Itagüí',
          type: 'MUNICIPALITY',
          isActive: true
        }
      }),
      prisma.zone.upsert({
        where: { name: 'Bello' },
        update: {},
        create: {
          name: 'Bello',
          type: 'MUNICIPALITY',
          isActive: true
        }
      }),
      prisma.zone.upsert({
        where: { name: 'Sabaneta' },
        update: {},
        create: {
          name: 'Sabaneta',
          type: 'MUNICIPALITY',
          isActive: true
        }
      }),
      prisma.zone.upsert({
        where: { name: 'Fuera del Valle' },
        update: {},
        create: {
          name: 'Fuera del Valle',
          type: 'OUTSIDE',
          isActive: true
        }
      })
    ])
    console.log('✅ Zonas creadas')

    const medellinZone = zones.find(z => z.name === 'Medellín')!
    const envigadoZone = zones.find(z => z.name === 'Envigado')!
    const itagüiZone = zones.find(z => z.name === 'Itagüí')!
    const belloZone = zones.find(z => z.name === 'Bello')!
    const sabanetaZone = zones.find(z => z.name === 'Sabaneta')!
    const outsideZone = zones.find(z => z.name === 'Fuera del Valle')!

    console.log('🛣️  Creando reglas de ruta...')
    const routeRules = await Promise.all([
      prisma.routeRule.create({
        data: {
          name: 'Dentro de Medellín',
          originZoneId: medellinZone.id,
          destinationZoneId: medellinZone.id,
          routeType: 'INTRA_ZONE',
          priority: 10,
          isActive: true
        }
      }),
      prisma.routeRule.create({
        data: {
          name: 'Medellín → Envigado',
          originZoneId: medellinZone.id,
          destinationZoneId: envigadoZone.id,
          routeType: 'MEDELLIN_TO_MUNICIPIO',
          priority: 8,
          isActive: true
        }
      }),
      prisma.routeRule.create({
        data: {
          name: 'Medellín → Itagüí',
          originZoneId: medellinZone.id,
          destinationZoneId: itagüiZone.id,
          routeType: 'MEDELLIN_TO_MUNICIPIO',
          priority: 8,
          isActive: true
        }
      }),
      prisma.routeRule.create({
        data: {
          name: 'Medellín → Bello',
          originZoneId: medellinZone.id,
          destinationZoneId: belloZone.id,
          routeType: 'MEDELLIN_TO_MUNICIPIO',
          priority: 8,
          isActive: true
        }
      }),
      prisma.routeRule.create({
        data: {
          name: 'Entre Municipios',
          originZoneId: null,
          destinationZoneId: null,
          routeType: 'OUTSIDE_GENERIC',
          priority: 5,
          isActive: true
        }
      }),
      prisma.routeRule.create({
        data: {
          name: 'Destinos Especiales',
          originZoneId: null,
          destinationZoneId: outsideZone.id,
          routeType: 'DESTINATION_SPECIAL',
          priority: 6,
          isActive: true
        }
      })
    ])
    console.log('✅ Reglas de ruta creadas')

    console.log('💰 Creando tarifas...')
    const standardService = services.find(s => s.name === 'Transporte Estándar')!
    const roboticService = services.find(s => s.name === 'Silla Robótica')!
    const medicalService = services.find(s => s.name === 'Traslado Médico')!

    const intraMedellinRule = routeRules.find(r => r.name === 'Dentro de Medellín')!
    const medellinEnvigadoRule = routeRules.find(r => r.name === 'Medellín → Envigado')!
    const medellinItagüiRule = routeRules.find(r => r.name === 'Medellín → Itagüí')!
    const betweenMunicipiosRule = routeRules.find(r => r.name === 'Entre Municipios')!
    const specialDestinationsRule = routeRules.find(r => r.name === 'Destinos Especiales')!

    const tariffRules = await Promise.all([
      prisma.tariffRule.create({
        data: {
          routeRuleId: intraMedellinRule.id,
          serviceId: standardService.id,
          pricingMode: 'PER_KM',
          pricePerKm: 4500,
          minPrice: 25000,
          isActive: true
        }
      }),
      prisma.tariffRule.create({
        data: {
          routeRuleId: intraMedellinRule.id,
          serviceId: roboticService.id,
          pricingMode: 'PER_KM',
          pricePerKm: 7000,
          minPrice: 45000,
          isActive: true
        }
      }),
      prisma.tariffRule.create({
        data: {
          routeRuleId: medellinEnvigadoRule.id,
          serviceId: standardService.id,
          pricingMode: 'FIXED',
          fixedPrice: 35000,
          isActive: true
        }
      }),
      prisma.tariffRule.create({
        data: {
          routeRuleId: medellinItagüiRule.id,
          serviceId: standardService.id,
          pricingMode: 'FIXED',
          fixedPrice: 32000,
          isActive: true
        }
      }),
      prisma.tariffRule.create({
        data: {
          routeRuleId: betweenMunicipiosRule.id,
          serviceId: standardService.id,
          pricingMode: 'BY_DISTANCE_TIER',
          isActive: true
        }
      }),
      prisma.tariffRule.create({
        data: {
          routeRuleId: specialDestinationsRule.id,
          serviceId: standardService.id,
          pricingMode: 'PER_KM',
          pricePerKm: 6000,
          minPrice: 50000,
          isActive: true
        }
      }),
      prisma.tariffRule.create({
        data: {
          routeRuleId: intraMedellinRule.id,
          serviceId: medicalService.id,
          pricingMode: 'PER_KM',
          pricePerKm: 5000,
          minPrice: 30000,
          isActive: true
        }
      })
    ])
    console.log('✅ Tarifas creadas')

    const tierTariff = tariffRules.find(t => 
      t.routeRuleId === betweenMunicipiosRule.id && 
      t.serviceId === standardService.id
    )!

    console.log('📊 Creando niveles de distancia...')
    await Promise.all([
      prisma.distanceTier.create({
        data: {
          tariffRuleId: tierTariff.id,
          minKm: 0,
          maxKm: 5,
          price: 25000
        }
      }),
      prisma.distanceTier.create({
        data: {
          tariffRuleId: tierTariff.id,
          minKm: 5,
          maxKm: 10,
          price: 35000
        }
      }),
      prisma.distanceTier.create({
        data: {
          tariffRuleId: tierTariff.id,
          minKm: 10,
          maxKm: 20,
          price: 45000
        }
      }),
      prisma.distanceTier.create({
        data: {
          tariffRuleId: tierTariff.id,
          minKm: 20,
          maxKm: null,
          price: 65000
        }
      })
    ])
    console.log('✅ Niveles de distancia creados')

    console.log('⚡ Creando reglas de recargo...')
    await Promise.all([
      prisma.surchargeRule.create({
        data: {
          name: 'Recargo Nocturno',
          type: 'NIGHT',
          amountType: 'PERCENTAGE',
          amount: 20,
          conditionJson: {
            timeRanges: [{ start: '19:00', end: '06:00' }]
          },
          isActive: true
        }
      }),
      prisma.surchargeRule.create({
        data: {
          name: 'Recargo Domingo/Festivo',
          type: 'SUNDAY_OR_HOLIDAY',
          amountType: 'PERCENTAGE',
          amount: 15,
          isActive: true
        }
      }),
      prisma.surchargeRule.create({
        data: {
          name: 'Silla Robótica',
          type: 'ROBOTIC_CHAIR',
          amountType: 'FIXED',
          amount: 25000,
          isActive: true
        }
      }),
      prisma.surchargeRule.create({
        data: {
          name: 'Piso Adicional (>3)',
          type: 'FLOOR_OVER_3',
          amountType: 'PER_UNIT',
          amount: 8000,
          unitLabel: 'piso',
          isActive: true
        }
      }),
      prisma.surchargeRule.create({
        data: {
          name: 'Tiempo de Espera',
          type: 'WAITING_HOUR',
          amountType: 'PER_UNIT',
          amount: 15000,
          unitLabel: 'hora',
          isActive: true
        }
      }),
      prisma.surchargeRule.create({
        data: {
          name: 'Uso de Silla de Ruedas',
          type: 'WHEELCHAIR_HOUR',
          amountType: 'PER_UNIT',
          amount: 10000,
          unitLabel: 'hora',
          isActive: true
        }
      })
    ])
    console.log('✅ Reglas de recargo creadas')

    console.log('🎉 Creando festivos colombianos 2024-2025...')
    const holidays = [
      { name: 'Año Nuevo', date: new Date('2024-01-01') },
      { name: 'Día de los Reyes Magos', date: new Date('2024-01-08') },
      { name: 'Día de San José', date: new Date('2024-03-25') },
      { name: 'Jueves Santo', date: new Date('2024-03-28') },
      { name: 'Viernes Santo', date: new Date('2024-03-29') },
      { name: 'Día del Trabajo', date: new Date('2024-05-01') },
      { name: 'Ascensión del Señor', date: new Date('2024-05-13') },
      { name: 'Corpus Christi', date: new Date('2024-06-03') },
      { name: 'Sagrado Corazón de Jesús', date: new Date('2024-06-10') },
      { name: 'San Pedro y San Pablo', date: new Date('2024-07-01') },
      { name: 'Día de la Independencia', date: new Date('2024-07-20') },
      { name: 'Batalla de Boyacá', date: new Date('2024-08-07') },
      { name: 'Asunción de la Virgen', date: new Date('2024-08-19') },
      { name: 'Día de la Raza', date: new Date('2024-10-14') },
      { name: 'Todos los Santos', date: new Date('2024-11-04') },
      { name: 'Independencia de Cartagena', date: new Date('2024-11-11') },
      { name: 'Inmaculada Concepción', date: new Date('2024-12-08') },
      { name: 'Navidad', date: new Date('2024-12-25') },
      
      { name: 'Año Nuevo 2025', date: new Date('2025-01-01') },
      { name: 'Día de los Reyes Magos 2025', date: new Date('2025-01-06') },
      { name: 'Día de San José 2025', date: new Date('2025-03-24') },
      { name: 'Jueves Santo 2025', date: new Date('2025-04-17') },
      { name: 'Viernes Santo 2025', date: new Date('2025-04-18') },
      { name: 'Día del Trabajo 2025', date: new Date('2025-05-01') },
      { name: 'Ascensión del Señor 2025', date: new Date('2025-06-02') },
      { name: 'Corpus Christi 2025', date: new Date('2025-06-23') },
      { name: 'Sagrado Corazón de Jesús 2025', date: new Date('2025-06-30') }
    ]

    await Promise.all(holidays.map(holiday =>
      prisma.holiday.upsert({
        where: { date: holiday.date },
        update: {},
        create: holiday
      })
    ))
    console.log('✅ Festivos creados')

    console.log('\n🎊 ¡Siembra de datos completada exitosamente!')
    console.log(`📋 ${services.length} servicios`)
    console.log(`🗺️  ${zones.length} zonas`)
    console.log(`🛣️  ${routeRules.length} reglas de ruta`)
    console.log(`💰 ${tariffRules.length} tarifas`)
    console.log(`📊 4 niveles de distancia`)
    console.log(`⚡ 6 reglas de recargo`)
    console.log(`🎉 ${holidays.length} festivos`)

  } catch (error) {
    console.error('❌ Error durante la siembra:', error)
    throw error
  }
}

if (require.main === module) {
  seedSampleData()
    .then(() => {
      console.log('✅ Proceso completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}

export { seedSampleData }