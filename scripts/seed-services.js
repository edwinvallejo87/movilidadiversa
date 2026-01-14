const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedServices() {
  console.log('🌱 Seeding services based on real tariff table...')

  const services = [
    // SERVICIOS SENCILLOS
    {
      name: 'Sencillo Rampa ≤ 3 KM',
      description: 'Servicio sencillo con rampa para distancias hasta 3 kilómetros',
      durationMinutes: 60,
      color: '#3B82F6',
      requiresVehicle: true,
      basePrice: 70000,
      category: 'SENCILLO',
      maxDistanceKm: 3
    },
    {
      name: 'Sencillo Rampa 3-10 KM', 
      description: 'Servicio sencillo con rampa para distancias de 3 a 10 kilómetros',
      durationMinutes: 90,
      color: '#3B82F6',
      requiresVehicle: true,
      basePrice: 75000,
      category: 'SENCILLO',
      minDistanceKm: 3,
      maxDistanceKm: 10
    },
    {
      name: 'Sencillo Rampa > 10 KM',
      description: 'Servicio sencillo con rampa para distancias mayores a 10 kilómetros',
      durationMinutes: 120,
      color: '#3B82F6', 
      requiresVehicle: true,
      basePrice: 80000,
      category: 'SENCILLO',
      minDistanceKm: 10
    },

    // SERVICIOS DOBLES
    {
      name: 'Doble Rampa ≤ 3 KM',
      description: 'Servicio doble con rampa para distancias hasta 3 kilómetros',
      durationMinutes: 60,
      color: '#10B981',
      requiresVehicle: true,
      basePrice: 130000,
      category: 'DOBLE',
      maxDistanceKm: 3
    },
    {
      name: 'Doble Rampa 3-10 KM',
      description: 'Servicio doble con rampa para distancias de 3 a 10 kilómetros', 
      durationMinutes: 90,
      color: '#10B981',
      requiresVehicle: true,
      basePrice: 140000,
      category: 'DOBLE',
      minDistanceKm: 3,
      maxDistanceKm: 10
    },
    {
      name: 'Doble Rampa > 10 KM',
      description: 'Servicio doble con rampa para distancias mayores a 10 kilómetros',
      durationMinutes: 120,
      color: '#10B981',
      requiresVehicle: true,
      basePrice: 150000,
      category: 'DOBLE',
      minDistanceKm: 10
    },

    // SERVICIOS ROBOTICA/PLEGABLE
    {
      name: 'Sencillo Robótica/Plegable ≤ 3 KM',
      description: 'Servicio sencillo robótica o plegable para distancias hasta 3 kilómetros',
      durationMinutes: 60,
      color: '#8B5CF6',
      requiresVehicle: true,
      basePrice: 98000,
      category: 'ROBOTICA_PLEGABLE',
      maxDistanceKm: 3
    },
    {
      name: 'Sencillo Robótica/Plegable 3-10 KM',
      description: 'Servicio sencillo robótica o plegable para distancias de 3 a 10 kilómetros',
      durationMinutes: 90, 
      color: '#8B5CF6',
      requiresVehicle: true,
      basePrice: 110000,
      category: 'ROBOTICA_PLEGABLE',
      minDistanceKm: 3,
      maxDistanceKm: 10
    },
    {
      name: 'Sencillo Robótica/Plegable > 10 KM',
      description: 'Servicio sencillo robótica o plegable para distancias mayores a 10 kilómetros',
      durationMinutes: 120,
      color: '#8B5CF6',
      requiresVehicle: true, 
      basePrice: 125000,
      category: 'ROBOTICA_PLEGABLE',
      minDistanceKm: 10
    },

    {
      name: 'Doble Robótica/Plegable ≤ 3 KM',
      description: 'Servicio doble robótica o plegable para distancias hasta 3 kilómetros',
      durationMinutes: 60,
      color: '#8B5CF6',
      requiresVehicle: true,
      basePrice: 180000,
      category: 'ROBOTICA_PLEGABLE',
      maxDistanceKm: 3
    },
    {
      name: 'Doble Robótica/Plegable 3-10 KM',
      description: 'Servicio doble robótica o plegable para distancias de 3 a 10 kilómetros',
      durationMinutes: 90,
      color: '#8B5CF6',
      requiresVehicle: true,
      basePrice: 196000,
      category: 'ROBOTICA_PLEGABLE', 
      minDistanceKm: 3,
      maxDistanceKm: 10
    },
    {
      name: 'Doble Robótica/Plegable > 10 KM',
      description: 'Servicio doble robótica o plegable para distancias mayores a 10 kilómetros',
      durationMinutes: 120,
      color: '#8B5CF6',
      requiresVehicle: true,
      basePrice: 220000,
      category: 'ROBOTICA_PLEGABLE',
      minDistanceKm: 10
    },

    // SERVICIOS ESPECIALES
    {
      name: 'Solo Silla Robótica ≤ Piso 3',
      description: 'Solo silla robótica para edificios hasta piso 3',
      durationMinutes: 30,
      color: '#F59E0B',
      requiresVehicle: false,
      basePrice: 65000,
      category: 'SOLO_SILLA',
      maxFloor: 3
    },
    {
      name: 'Solo Silla Robótica > Piso 3',
      description: 'Solo silla robótica para edificios mayor a piso 3 (con recargo)',
      durationMinutes: 45,
      color: '#F59E0B',
      requiresVehicle: false,
      basePrice: 55000,
      category: 'SOLO_SILLA',
      minFloor: 4
    },
    {
      name: 'Hora de Espera',
      description: 'Hora de espera del vehículo',
      durationMinutes: 60,
      color: '#EF4444',
      requiresVehicle: true,
      basePrice: 30000,
      category: 'ESPERA',
      isHourly: true
    },
    {
      name: 'Hora Silla Ruedas Convencional',
      description: 'Hora de silla de ruedas convencional para trayecto',
      durationMinutes: 60,
      color: '#6B7280',
      requiresVehicle: false,
      basePrice: 5000,
      category: 'RUEDAS_CONVENCIONAL',
      isHourly: true
    },
    {
      name: 'Solo Ruedas para Trayecto',
      description: 'Solo sillas de ruedas para el trayecto',
      durationMinutes: 60,
      color: '#6B7280',
      requiresVehicle: false,
      basePrice: 5000,
      category: 'SOLO_RUEDAS'
    }
  ]

  for (const service of services) {
    try {
      await prisma.service.upsert({
        where: { name: service.name },
        update: service,
        create: service
      })
      console.log(`✅ Service created/updated: ${service.name}`)
    } catch (error) {
      console.error(`❌ Error creating service ${service.name}:`, error)
    }
  }

  console.log('🎉 Services seeded successfully!')
}

async function seedSurcharges() {
  console.log('🌱 Seeding surcharges...')

  const surcharges = [
    {
      name: 'Recargo Horario Nocturno',
      type: 'TIME_BASED',
      amountType: 'FIXED',
      amount: 35000,
      isActive: true,
      conditionJson: JSON.stringify({
        timeRanges: [{ start: '18:00', end: '06:00' }]
      })
    },
    {
      name: 'Recargo Dominical/Festivo',
      type: 'DAY_BASED',
      amountType: 'FIXED', 
      amount: 35000,
      isActive: true,
      conditionJson: JSON.stringify({
        daysOfWeek: [0], // Domingo
        holidays: true
      })
    },
    {
      name: 'Recargo por Piso (>3)',
      type: 'FLOOR_BASED',
      amountType: 'FIXED',
      amount: 5000,
      isActive: true,
      conditionJson: JSON.stringify({
        minFloor: 4
      })
    }
  ]

  for (const surcharge of surcharges) {
    try {
      await prisma.surchargeRule.upsert({
        where: { name: surcharge.name },
        update: surcharge,
        create: surcharge
      })
      console.log(`✅ Surcharge created/updated: ${surcharge.name}`)
    } catch (error) {
      console.error(`❌ Error creating surcharge ${surcharge.name}:`, error)
    }
  }

  console.log('🎉 Surcharges seeded successfully!')
}

async function main() {
  try {
    await seedServices()
    await seedSurcharges()
  } catch (error) {
    console.error('Error seeding data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()