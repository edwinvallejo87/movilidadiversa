const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedPricingSystem() {
  console.log('🌱 Seeding complete pricing system based on analysis...')

  // 1. Create Zones
  const zones = [
    { name: 'MEDELLIN', slug: 'medellin', isMetro: true },
    { name: 'BELLO-ITAGUI-ENVIGADO', slug: 'bello-itagui-envigado', isMetro: true },
    { name: 'SABANETA', slug: 'sabaneta', isMetro: true },
    { name: 'LA ESTRELLA-CALDAS', slug: 'la-estrella-caldas', isMetro: true },
    { name: 'FUERA DE CIUDAD', slug: 'fuera-ciudad', isMetro: false }
  ]

  const createdZones = {}
  for (const zone of zones) {
    const created = await prisma.zone.upsert({
      where: { slug: zone.slug },
      update: zone,
      create: zone
    })
    createdZones[zone.slug] = created
    console.log(`✅ Zone: ${zone.name}`)
  }

  // 2. Create Rates for MEDELLIN (with distance ranges)
  console.log('\n📍 Creating Medellín rates...')
  const medellinRates = [
    // Hasta 3 KM
    { tripType: 'SENCILLO', equipment: 'RAMPA', distance: 'HASTA_3KM', price: 70000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', distance: 'HASTA_3KM', price: 130000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', distance: 'HASTA_3KM', price: 98000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', distance: 'HASTA_3KM', price: 180000 },
    
    // 3 a 10 KM
    { tripType: 'SENCILLO', equipment: 'RAMPA', distance: 'DE_3_A_10KM', price: 75000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', distance: 'DE_3_A_10KM', price: 140000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', distance: 'DE_3_A_10KM', price: 110000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', distance: 'DE_3_A_10KM', price: 196000 },
    
    // Más de 10 KM
    { tripType: 'SENCILLO', equipment: 'RAMPA', distance: 'MAS_10KM', price: 80000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', distance: 'MAS_10KM', price: 150000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', distance: 'MAS_10KM', price: 125000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', distance: 'MAS_10KM', price: 220000 },
  ]

  for (const rate of medellinRates) {
    await prisma.rate.create({
      data: {
        zoneId: createdZones['medellin'].id,
        tripType: rate.tripType,
        equipmentType: rate.equipment,
        distanceRange: rate.distance,
        price: rate.price
      }
    })
    console.log(`  ✅ ${rate.tripType} ${rate.equipment} ${rate.distance}: $${rate.price.toLocaleString()}`)
  }

  // 3. Create Rates for BELLO-ITAGUI-ENVIGADO
  console.log('\n🏘️ Creating Bello-Itagüí-Envigado rates...')
  const bieRates = [
    // Desde Medellín
    { tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 85000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 160000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', origin: 'DESDE_MEDELLIN', price: 130000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', origin: 'DESDE_MEDELLIN', price: 240000 },
    // Mismo municipio
    { tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 80000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 150000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', origin: 'MISMO_MUNICIPIO', price: 110000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', origin: 'MISMO_MUNICIPIO', price: 196000 },
  ]

  for (const rate of bieRates) {
    await prisma.rate.create({
      data: {
        zoneId: createdZones['bello-itagui-envigado'].id,
        tripType: rate.tripType,
        equipmentType: rate.equipment,
        originType: rate.origin,
        price: rate.price
      }
    })
    console.log(`  ✅ ${rate.tripType} ${rate.equipment} ${rate.origin}: $${rate.price.toLocaleString()}`)
  }

  // 4. Create Rates for SABANETA
  console.log('\n🏘️ Creating Sabaneta rates...')
  const sabanetaRates = [
    // Desde Medellín
    { tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 95000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 180000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', origin: 'DESDE_MEDELLIN', price: 130000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', origin: 'DESDE_MEDELLIN', price: 240000 },
    // Mismo municipio
    { tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 85000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 150000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', origin: 'MISMO_MUNICIPIO', price: 110000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', origin: 'MISMO_MUNICIPIO', price: 196000 },
  ]

  for (const rate of sabanetaRates) {
    await prisma.rate.create({
      data: {
        zoneId: createdZones['sabaneta'].id,
        tripType: rate.tripType,
        equipmentType: rate.equipment,
        originType: rate.origin,
        price: rate.price
      }
    })
    console.log(`  ✅ ${rate.tripType} ${rate.equipment} ${rate.origin}: $${rate.price.toLocaleString()}`)
  }

  // 5. Create Rates for LA ESTRELLA-CALDAS
  console.log('\n🏘️ Creating La Estrella-Caldas rates...')
  const laEstrellaCaldas = [
    // Desde Medellín
    { tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 98000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 196000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', origin: 'DESDE_MEDELLIN', price: 150000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', origin: 'DESDE_MEDELLIN', price: 280000 },
    // Mismo municipio
    { tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 90000 },
    { tripType: 'DOBLE', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 180000 },
    { tripType: 'SENCILLO', equipment: 'ROBOTICA_PLEGABLE', origin: 'MISMO_MUNICIPIO', price: 140000 },
    { tripType: 'DOBLE', equipment: 'ROBOTICA_PLEGABLE', origin: 'MISMO_MUNICIPIO', price: 220000 },
  ]

  for (const rate of laEstrellaCaldas) {
    await prisma.rate.create({
      data: {
        zoneId: createdZones['la-estrella-caldas'].id,
        tripType: rate.tripType,
        equipmentType: rate.equipment,
        originType: rate.origin,
        price: rate.price
      }
    })
    console.log(`  ✅ ${rate.tripType} ${rate.equipment} ${rate.origin}: $${rate.price.toLocaleString()}`)
  }

  // 6. Create Additional Services
  console.log('\n🔧 Creating additional services...')
  const additionalServices = [
    { code: 'SILLA_ROBOTICA_HASTA_P3', name: 'Solo silla robótica hasta piso 3', price: 65000, priceType: 'FIJO' },
    { code: 'SILLA_ROBOTICA_PISO_EXTRA', name: 'Silla robótica piso adicional (+3)', price: 5000, priceType: 'POR_UNIDAD' },
    { code: 'HORA_ESPERA', name: 'Hora de espera', price: 30000, priceType: 'POR_HORA' },
    { code: 'SILLA_CONVENCIONAL_HORA', name: 'Hora silla de ruedas convencional', price: 5000, priceType: 'POR_HORA' },
    { code: 'SILLA_TRAYECTO', name: 'Silla de ruedas solo para el trayecto', price: 5000, priceType: 'FIJO' },
  ]

  for (const service of additionalServices) {
    await prisma.additionalService.upsert({
      where: { code: service.code },
      update: service,
      create: service
    })
    console.log(`  ✅ ${service.name}: $${service.price.toLocaleString()} (${service.priceType})`)
  }

  // 7. Create Surcharges
  console.log('\n💰 Creating surcharges...')
  const surcharges = [
    { code: 'NOCTURNO', name: 'Recargo horario nocturno', price: 35000 },
    { code: 'DOMINICAL_FESTIVO', name: 'Recargo dominical o festivo', price: 35000 },
  ]

  for (const surcharge of surcharges) {
    await prisma.surcharge.upsert({
      where: { code: surcharge.code },
      update: surcharge,
      create: surcharge
    })
    console.log(`  ✅ ${surcharge.name}: $${surcharge.price.toLocaleString()}`)
  }

  // 8. Create Out of City Destinations
  console.log('\n✈️ Creating out of city destinations...')
  const outOfCityDestinations = [
    // Aeropuerto JMC
    { name: 'Aeropuerto JMC', tripType: 'SENCILLO', equipment: 'RAMPA', price: 280000 },
    { name: 'Aeropuerto JMC', tripType: 'DOBLE', equipment: 'RAMPA', price: 310000 },
    // Rionegro
    { name: 'Rionegro', tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 280000 },
    { name: 'Rionegro', tripType: 'DOBLE', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 480000 },
    { name: 'Rionegro', tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 220000 },
    { name: 'Rionegro', tripType: 'DOBLE', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 360000 },
    // La Ceja
    { name: 'La Ceja', tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 323000 },
    { name: 'La Ceja', tripType: 'DOBLE', equipment: 'RAMPA', origin: 'DESDE_MEDELLIN', price: 523000 },
    { name: 'La Ceja', tripType: 'SENCILLO', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 263000 },
    { name: 'La Ceja', tripType: 'DOBLE', equipment: 'RAMPA', origin: 'MISMO_MUNICIPIO', price: 403000 },
  ]

  for (const destination of outOfCityDestinations) {
    await prisma.outOfCityDestination.create({
      data: {
        name: destination.name,
        tripType: destination.tripType,
        equipmentType: destination.equipment,
        originType: destination.origin || null,
        price: destination.price
      }
    })
    console.log(`  ✅ ${destination.name} ${destination.tripType} ${destination.equipment} ${destination.origin || ''}: $${destination.price.toLocaleString()}`)
  }

  // 9. Create Pricing Config
  console.log('\n⚙️ Creating pricing configuration...')
  const pricingConfig = {
    pricePerKm: 8500,        // $8,500 por KM adicional
    roboticSurcharge: 40000, // $40,000 recargo silla robótica
  }

  await prisma.pricingConfig.upsert({
    where: { id: 'default' },
    update: pricingConfig,
    create: { id: 'default', ...pricingConfig }
  })
  console.log(`  ✅ Price per KM: $${pricingConfig.pricePerKm.toLocaleString()}`)
  console.log(`  ✅ Robotic surcharge: $${pricingConfig.roboticSurcharge.toLocaleString()}`)

  console.log('\n🎉 Pricing system seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`  • ${zones.length} zones created`)
  console.log(`  • ${medellinRates.length + bieRates.length + sabanetaRates.length + laEstrellaCaldas.length} rates created`)
  console.log(`  • ${additionalServices.length} additional services created`)
  console.log(`  • ${surcharges.length} surcharges created`)
  console.log(`  • ${outOfCityDestinations.length} out of city destinations created`)
}

async function main() {
  try {
    await seedPricingSystem()
  } catch (error) {
    console.error('❌ Error seeding pricing system:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})