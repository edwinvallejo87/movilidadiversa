import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.rate.deleteMany()
  await prisma.zone.deleteMany()
  await prisma.additionalService.deleteMany()
  await prisma.surcharge.deleteMany()
  await prisma.outOfCityDestination.deleteMany()
  await prisma.pricingConfig.deleteMany()
  await prisma.equipmentType.deleteMany()

  // ===== EQUIPMENT TYPES =====
  console.log('Creating equipment types...')

  await prisma.equipmentType.createMany({
    data: [
      { name: 'Vehículo con Rampa', slug: 'RAMPA', description: 'Vehículo adaptado con rampa para silla de ruedas' },
      { name: 'Silla Robótica Plegable', slug: 'ROBOTICA_PLEGABLE', description: 'Servicio con silla robótica plegable para escaleras' },
    ]
  })

  // ===== ZONES =====
  console.log('Creating zones...')

  const medellin = await prisma.zone.create({
    data: {
      name: 'MEDELLIN',
      slug: 'medellin',
      isMetro: true
    }
  })

  const bie = await prisma.zone.create({
    data: {
      name: 'BELLO-ITAGUI-ENVIGADO',
      slug: 'bello-itagui-envigado',
      isMetro: true
    }
  })

  const sabaneta = await prisma.zone.create({
    data: {
      name: 'SABANETA',
      slug: 'sabaneta',
      isMetro: true
    }
  })

  const laEstrellaCaldas = await prisma.zone.create({
    data: {
      name: 'LA ESTRELLA-CALDAS',
      slug: 'la-estrella-caldas',
      isMetro: true
    }
  })

  const fueraCiudad = await prisma.zone.create({
    data: {
      name: 'FUERA DE LA CIUDAD',
      slug: 'fuera-ciudad',
      isMetro: false
    }
  })

  // ===== RATES FOR MEDELLIN (Distance-based) =====
  console.log('Creating Medellin rates...')

  const medellinRates = [
    // <= 3 KM
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', distanceRange: 'HASTA_3KM', price: 70000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', distanceRange: 'HASTA_3KM', price: 130000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', distanceRange: 'HASTA_3KM', price: 98000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', distanceRange: 'HASTA_3KM', price: 180000 },
    // 3 - 10 KM
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', distanceRange: 'DE_3_A_10KM', price: 75000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', distanceRange: 'DE_3_A_10KM', price: 140000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', distanceRange: 'DE_3_A_10KM', price: 110000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', distanceRange: 'DE_3_A_10KM', price: 196000 },
    // > 10 KM
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', distanceRange: 'MAS_10KM', price: 80000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', distanceRange: 'MAS_10KM', price: 150000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', distanceRange: 'MAS_10KM', price: 125000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', distanceRange: 'MAS_10KM', price: 220000 },
  ]

  for (const rate of medellinRates) {
    await prisma.rate.create({
      data: {
        zoneId: medellin.id,
        ...rate,
        originType: null
      }
    })
  }

  // ===== RATES FOR BIE (Bello-Itagui-Envigado) =====
  console.log('Creating BIE rates...')

  const bieRates = [
    // Desde Medellin
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 85000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 160000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'DESDE_MEDELLIN', price: 130000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'DESDE_MEDELLIN', price: 240000 },
    // Mismo Municipio
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'MISMO_MUNICIPIO', price: 80000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'MISMO_MUNICIPIO', price: 150000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'MISMO_MUNICIPIO', price: 110000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'MISMO_MUNICIPIO', price: 196000 },
  ]

  for (const rate of bieRates) {
    await prisma.rate.create({
      data: {
        zoneId: bie.id,
        ...rate,
        distanceRange: null
      }
    })
  }

  // ===== RATES FOR SABANETA =====
  console.log('Creating Sabaneta rates...')

  const sabanetaRates = [
    // Desde Medellin
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 95000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 180000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'DESDE_MEDELLIN', price: 130000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'DESDE_MEDELLIN', price: 240000 },
    // Mismo Municipio
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'MISMO_MUNICIPIO', price: 85000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'MISMO_MUNICIPIO', price: 150000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'MISMO_MUNICIPIO', price: 110000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'MISMO_MUNICIPIO', price: 196000 },
  ]

  for (const rate of sabanetaRates) {
    await prisma.rate.create({
      data: {
        zoneId: sabaneta.id,
        ...rate,
        distanceRange: null
      }
    })
  }

  // ===== RATES FOR LA ESTRELLA-CALDAS =====
  console.log('Creating La Estrella-Caldas rates...')

  const laEstrellaCaldadRates = [
    // Desde Medellin
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 98000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 196000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'DESDE_MEDELLIN', price: 150000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'DESDE_MEDELLIN', price: 280000 },
    // Mismo Municipio
    { tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'MISMO_MUNICIPIO', price: 90000 },
    { tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'MISMO_MUNICIPIO', price: 180000 },
    { tripType: 'SENCILLO', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'MISMO_MUNICIPIO', price: 140000 },
    { tripType: 'DOBLE', equipmentType: 'ROBOTICA_PLEGABLE', originType: 'MISMO_MUNICIPIO', price: 220000 },
  ]

  for (const rate of laEstrellaCaldadRates) {
    await prisma.rate.create({
      data: {
        zoneId: laEstrellaCaldas.id,
        ...rate,
        distanceRange: null
      }
    })
  }

  // ===== OUT OF CITY DESTINATIONS =====
  console.log('Creating out of city destinations...')

  const outOfCityDestinations = [
    // Aeropuerto JMC
    { name: 'Aeropuerto JMC', tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 280000 },
    { name: 'Aeropuerto JMC', tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 310000 },
    // Rionegro
    { name: 'Rionegro', tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 280000 },
    { name: 'Rionegro', tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 480000 },
    { name: 'Rionegro', tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'MISMA_CIUDAD', price: 220000 },
    { name: 'Rionegro', tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'MISMA_CIUDAD', price: 360000 },
    // La Ceja
    { name: 'La Ceja', tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 323000 },
    { name: 'La Ceja', tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'DESDE_MEDELLIN', price: 523000 },
    { name: 'La Ceja', tripType: 'SENCILLO', equipmentType: 'RAMPA', originType: 'MISMA_CIUDAD', price: 263000 },
    { name: 'La Ceja', tripType: 'DOBLE', equipmentType: 'RAMPA', originType: 'MISMA_CIUDAD', price: 403000 },
  ]

  for (const dest of outOfCityDestinations) {
    await prisma.outOfCityDestination.create({ data: dest })
  }

  // ===== ADDITIONAL SERVICES =====
  console.log('Creating additional services...')

  const additionalServices = [
    // Medellin prices (varies by zone)
    { code: 'SILLA_ROBOTICA_HASTA_PISO_3_MDE', name: 'Solo silla robotica hasta piso 3 (Medellin)', price: 65000, priceType: 'FIJO', description: 'Servicio de silla robotica para subir/bajar hasta el piso 3 en Medellin' },
    { code: 'SILLA_ROBOTICA_HASTA_PISO_3_BIE', name: 'Solo silla robotica hasta piso 3 (BIE)', price: 75000, priceType: 'FIJO', description: 'Servicio de silla robotica para subir/bajar hasta el piso 3 en Bello/Itagui/Envigado' },
    { code: 'SILLA_ROBOTICA_HASTA_PISO_3_SAB', name: 'Solo silla robotica hasta piso 3 (Sabaneta)', price: 75000, priceType: 'FIJO', description: 'Servicio de silla robotica para subir/bajar hasta el piso 3 en Sabaneta' },
    { code: 'SILLA_ROBOTICA_HASTA_PISO_3_LEC', name: 'Solo silla robotica hasta piso 3 (La Estrella/Caldas)', price: 85000, priceType: 'FIJO', description: 'Servicio de silla robotica para subir/bajar hasta el piso 3 en La Estrella/Caldas' },
    { code: 'RECARGO_PISO_ADICIONAL', name: 'Recargo por piso adicional (mas de 3)', price: 5000, priceType: 'POR_UNIDAD', description: 'Recargo por cada piso adicional despues del piso 3' },
    { code: 'HORA_ESPERA', name: 'Hora de espera', price: 30000, priceType: 'POR_HORA', description: 'Costo por hora de espera durante el servicio' },
    { code: 'SILLA_RUEDAS_CONVENCIONAL', name: 'Hora de silla de ruedas convencional', price: 5000, priceType: 'POR_HORA', description: 'Alquiler de silla de ruedas convencional por hora' },
    { code: 'SILLA_RUEDAS_TRAYECTO', name: 'Silla de ruedas solo para el trayecto', price: 5000, priceType: 'FIJO', description: 'Uso de silla de ruedas solo durante el trayecto' },
  ]

  for (const service of additionalServices) {
    await prisma.additionalService.create({ data: service })
  }

  // ===== SURCHARGES =====
  console.log('Creating surcharges...')

  const surcharges = [
    { code: 'NOCTURNO', name: 'Recargo por horario nocturno', price: 35000, description: 'Aplica para servicios entre las 6:00 PM y 6:00 AM' },
    { code: 'DOMINICAL_FESTIVO', name: 'Recargo por domingo o festivo', price: 35000, description: 'Aplica para servicios en domingos o dias festivos' },
    { code: 'ROBOTICA_FUERA_CIUDAD', name: 'Recargo por silla robotica (fuera de ciudad)', price: 40000, description: 'Recargo adicional por uso de silla robotica en destinos fuera de la ciudad' },
  ]

  for (const surcharge of surcharges) {
    await prisma.surcharge.create({ data: surcharge })
  }

  // ===== PRICING CONFIG =====
  console.log('Creating pricing config...')

  await prisma.pricingConfig.create({
    data: {
      pricePerKm: 8500,
      roboticSurcharge: 40000
    }
  })

  console.log('Tariff seeding completed successfully!')

  // Print summary
  const equipmentCount = await prisma.equipmentType.count()
  const zoneCount = await prisma.zone.count()
  const rateCount = await prisma.rate.count()
  const destCount = await prisma.outOfCityDestination.count()
  const serviceCount = await prisma.additionalService.count()
  const surchargeCount = await prisma.surcharge.count()

  console.log(`
Summary:
- Equipment Types: ${equipmentCount}
- Zones: ${zoneCount}
- Rates: ${rateCount}
- Out of City Destinations: ${destCount}
- Additional Services: ${serviceCount}
- Surcharges: ${surchargeCount}
  `)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
