import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBriskData() {
  console.log('🌱 Iniciando siembra de datos estilo Brisk...')

  try {
    // 1. SERVICIOS con colores para calendario
    console.log('📋 Creando servicios...')
    const services = await Promise.all([
      prisma.service.create({
        data: {
          name: 'Transporte Estándar',
          description: 'Servicio de transporte con vehículos adaptados',
          durationMinutes: 60,
          color: '#3B82F6', // Blue
          requiresVehicle: true,
          isActive: true
        }
      }),
      prisma.service.create({
        data: {
          name: 'Silla Robótica',
          description: 'Servicio especializado con silla robótica para escaleras',
          durationMinutes: 90,
          color: '#EF4444', // Red
          requiresVehicle: true,
          isActive: true
        }
      }),
      prisma.service.create({
        data: {
          name: 'Traslado Médico',
          description: 'Transporte especializado para citas médicas',
          durationMinutes: 120,
          color: '#10B981', // Green
          requiresVehicle: true,
          isActive: true
        }
      }),
      prisma.service.create({
        data: {
          name: 'Acompañamiento',
          description: 'Servicio de acompañamiento personal',
          durationMinutes: 180,
          color: '#F59E0B', // Yellow
          requiresVehicle: false,
          isActive: true
        }
      })
    ])
    console.log('✅ Servicios creados')

    // 2. ZONAS geográficas
    console.log('🗺️ Creando zonas...')
    const zones = await Promise.all([
      prisma.zone.create({
        data: { name: 'Medellín', type: 'CITY', isActive: true }
      }),
      prisma.zone.create({
        data: { name: 'Envigado', type: 'MUNICIPALITY', isActive: true }
      }),
      prisma.zone.create({
        data: { name: 'Itagüí', type: 'MUNICIPALITY', isActive: true }
      }),
      prisma.zone.create({
        data: { name: 'Bello', type: 'MUNICIPALITY', isActive: true }
      }),
      prisma.zone.create({
        data: { name: 'Sabaneta', type: 'MUNICIPALITY', isActive: true }
      })
    ])
    console.log('✅ Zonas creadas')

    // 3. STAFF (Vehículos y Conductores) - estilo Brisk
    console.log('🚗 Creando staff (vehículos y conductores)...')
    const staff = await Promise.all([
      // Vehículos
      prisma.staff.create({
        data: {
          name: 'Van Mercedes Sprinter',
          type: 'VEHICLE',
          status: 'AVAILABLE',
          licensePlate: 'ABC-123',
          capacity: 6,
          isWheelchairAccessible: true,
          workDays: '1,2,3,4,5,6', // Lun-Sab
          workStartTime: '06:00',
          workEndTime: '20:00',
          isActive: true
        }
      }),
      prisma.staff.create({
        data: {
          name: 'Van Toyota Hiace',
          type: 'VEHICLE',
          status: 'AVAILABLE',
          licensePlate: 'DEF-456',
          capacity: 8,
          isWheelchairAccessible: true,
          workDays: '1,2,3,4,5',
          workStartTime: '07:00',
          workEndTime: '19:00',
          isActive: true
        }
      }),
      prisma.staff.create({
        data: {
          name: 'Sedan Toyota Corolla',
          type: 'VEHICLE',
          status: 'AVAILABLE',
          licensePlate: 'GHI-789',
          capacity: 4,
          isWheelchairAccessible: false,
          workDays: '1,2,3,4,5',
          workStartTime: '08:00',
          workEndTime: '18:00',
          isActive: true
        }
      }),
      
      // Conductores
      prisma.staff.create({
        data: {
          name: 'Carlos Rodríguez',
          type: 'DRIVER',
          status: 'AVAILABLE',
          phone: '+57 300 123-4567',
          email: 'carlos@movilidaddiversa.co',
          licenseNumber: 'CC12345678',
          workDays: '1,2,3,4,5,6',
          workStartTime: '06:00',
          workEndTime: '18:00',
          isActive: true
        }
      }),
      prisma.staff.create({
        data: {
          name: 'María González',
          type: 'DRIVER',
          status: 'AVAILABLE',
          phone: '+57 301 234-5678',
          email: 'maria@movilidaddiversa.co',
          licenseNumber: 'CC23456789',
          workDays: '1,2,3,4,5',
          workStartTime: '07:00',
          workEndTime: '19:00',
          isActive: true
        }
      }),
      prisma.staff.create({
        data: {
          name: 'Juan Pérez',
          type: 'DRIVER',
          status: 'AVAILABLE',
          phone: '+57 302 345-6789',
          email: 'juan@movilidaddiversa.co',
          licenseNumber: 'CC34567890',
          workDays: '1,2,3,4,5,6',
          workStartTime: '08:00',
          workEndTime: '20:00',
          isActive: true
        }
      }),
      
      // Asistentes
      prisma.staff.create({
        data: {
          name: 'Ana Martínez',
          type: 'ASSISTANT',
          status: 'AVAILABLE',
          phone: '+57 303 456-7890',
          email: 'ana@movilidaddiversa.co',
          workDays: '1,2,3,4,5',
          workStartTime: '07:00',
          workEndTime: '17:00',
          isActive: true
        }
      }),
      prisma.staff.create({
        data: {
          name: 'Luis Torres',
          type: 'ASSISTANT',
          status: 'AVAILABLE',
          phone: '+57 304 567-8901',
          email: 'luis@movilidaddiversa.co',
          workDays: '2,3,4,5,6',
          workStartTime: '09:00',
          workEndTime: '19:00',
          isActive: true
        }
      })
    ])
    console.log('✅ Staff creado')

    // 4. CLIENTES con datos detallados
    console.log('👥 Creando clientes...')
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          name: 'Elena Ramírez',
          email: 'elena.ramirez@email.com',
          phone: '+57 310 123-4567',
          document: '43123456',
          emergencyContact: '+57 320 987-6543',
          medicalNotes: 'Diabetes controlada, requiere asistencia para caminar',
          mobilityNeeds: JSON.stringify(['wheelchair', 'assistance']),
          defaultAddress: 'Cra 70 #45-30, El Poblado, Medellín',
          defaultLat: 6.2088,
          defaultLng: -75.5648,
          isActive: true
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Roberto Silva',
          email: 'roberto.silva@email.com',
          phone: '+57 311 234-5678',
          document: '71234567',
          emergencyContact: '+57 321 876-5432',
          medicalNotes: 'Movilidad reducida por lesión en pierna derecha',
          mobilityNeeds: JSON.stringify(['walker', 'ramp_access']),
          defaultAddress: 'Calle 33 #70-50, Laureles, Medellín',
          defaultLat: 6.2518,
          defaultLng: -75.5907,
          isActive: true
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Carmen López',
          email: 'carmen.lopez@email.com',
          phone: '+57 312 345-6789',
          document: '55987654',
          emergencyContact: '+57 322 765-4321',
          medicalNotes: 'Usuario de silla de ruedas permanente',
          mobilityNeeds: JSON.stringify(['wheelchair', 'lift_required']),
          defaultAddress: 'Av 80 #30-20, Zona Industriales, Medellín',
          defaultLat: 6.2279,
          defaultLng: -75.5755,
          isActive: true
        }
      }),
      prisma.customer.create({
        data: {
          name: 'Alberto Gómez',
          email: 'alberto.gomez@email.com',
          phone: '+57 313 456-7890',
          document: '98765432',
          emergencyContact: '+57 323 654-3210',
          medicalNotes: 'Ceguera parcial, requiere acompañamiento',
          mobilityNeeds: JSON.stringify(['visual_assistance', 'guide']),
          defaultAddress: 'Cra 43A #18-95, Centro, Medellín',
          defaultLat: 6.2476,
          defaultLng: -75.5658,
          isActive: true
        }
      })
    ])
    console.log('✅ Clientes creados')

    // 5. TARIFAS básicas
    console.log('💰 Creando reglas de ruta y tarifas...')
    const medellinZone = zones.find(z => z.name === 'Medellín')!
    const envigadoZone = zones.find(z => z.name === 'Envigado')!
    
    const routeRule = await prisma.routeRule.create({
      data: {
        name: 'Dentro de Medellín',
        originZoneId: medellinZone.id,
        destinationZoneId: medellinZone.id,
        routeType: 'INTRA_ZONE',
        priority: 10,
        isActive: true
      }
    })

    await Promise.all(services.map(service => 
      prisma.tariffRule.create({
        data: {
          routeRuleId: routeRule.id,
          serviceId: service.id,
          pricingMode: 'PER_KM',
          pricePerKm: service.name === 'Silla Robótica' ? 8000 : 
                     service.name === 'Traslado Médico' ? 6000 : 4500,
          minPrice: service.name === 'Silla Robótica' ? 45000 : 
                   service.name === 'Traslado Médico' ? 35000 : 25000,
          isActive: true
        }
      })
    ))
    console.log('✅ Tarifas creadas')

    // 6. CITAS de ejemplo (estilo calendario Brisk)
    console.log('📅 Creando citas de ejemplo...')
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const appointments = await Promise.all([
      // HOY
      prisma.appointment.create({
        data: {
          serviceId: services[0].id, // Transporte Estándar
          customerId: customers[0].id, // Elena
          staffId: staff[0].id, // Van Mercedes
          originAddress: 'Cra 70 #45-30, El Poblado, Medellín',
          originLat: 6.2088,
          originLng: -75.5648,
          destinationAddress: 'Hospital Pablo Tobón Uribe, Cra 51D #80-142',
          destinationLat: 6.2633,
          destinationLng: -75.5507,
          scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
          estimatedDuration: 60,
          distanceKm: 8.5,
          totalAmount: 38250,
          pricingSnapshot: JSON.stringify({
            baseFare: 38250,
            surcharges: [],
            total: 38250
          }),
          status: 'CONFIRMED',
          notes: 'Cita médica rutinaria, paciente requiere asistencia',
        }
      }),
      prisma.appointment.create({
        data: {
          serviceId: services[1].id, // Silla Robótica
          customerId: customers[2].id, // Carmen
          staffId: staff[1].id, // Van Toyota
          originAddress: 'Av 80 #30-20, Zona Industriales, Medellín',
          originLat: 6.2279,
          originLng: -75.5755,
          destinationAddress: 'Centro Comercial Santafé, Cra 51 #54-1',
          destinationLat: 6.2518,
          destinationLng: -75.5636,
          scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30),
          estimatedDuration: 90,
          distanceKm: 5.2,
          totalAmount: 45000,
          pricingSnapshot: JSON.stringify({
            baseFare: 45000,
            surcharges: [],
            total: 45000
          }),
          status: 'PENDING',
          notes: 'Edificio sin ascensor, necesario usar silla robótica',
        }
      }),
      prisma.appointment.create({
        data: {
          serviceId: services[2].id, // Traslado Médico
          customerId: customers[1].id, // Roberto
          staffId: staff[3].id, // Carlos (conductor)
          originAddress: 'Calle 33 #70-50, Laureles, Medellín',
          originLat: 6.2518,
          originLng: -75.5907,
          destinationAddress: 'Clínica León XIII, Cra 51B #92-19',
          destinationLat: 6.2725,
          destinationLng: -75.5513,
          scheduledAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
          estimatedDuration: 120,
          distanceKm: 6.8,
          totalAmount: 40800,
          pricingSnapshot: JSON.stringify({
            baseFare: 40800,
            surcharges: [],
            total: 40800
          }),
          status: 'IN_PROGRESS',
          notes: 'Terapia física, incluye tiempo de espera',
        }
      }),

      // MAÑANA
      prisma.appointment.create({
        data: {
          serviceId: services[3].id, // Acompañamiento
          customerId: customers[3].id, // Alberto
          staffId: staff[6].id, // Ana (asistente)
          originAddress: 'Cra 43A #18-95, Centro, Medellín',
          originLat: 6.2476,
          originLng: -75.5658,
          destinationAddress: 'Banco de Bogotá, Cra 49 #50-21',
          destinationLat: 6.2518,
          destinationLng: -75.5636,
          scheduledAt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0),
          estimatedDuration: 180,
          distanceKm: 2.1,
          totalAmount: 35000,
          pricingSnapshot: JSON.stringify({
            baseFare: 35000,
            surcharges: [],
            total: 35000
          }),
          status: 'CONFIRMED',
          notes: 'Trámites bancarios, requiere acompañamiento por discapacidad visual',
        }
      }),
      prisma.appointment.create({
        data: {
          serviceId: services[0].id, // Transporte Estándar
          customerId: customers[0].id, // Elena
          staffId: staff[0].id, // Van Mercedes
          originAddress: 'Hospital Pablo Tobón Uribe',
          originLat: 6.2633,
          originLng: -75.5507,
          destinationAddress: 'Cra 70 #45-30, El Poblado, Medellín',
          destinationLat: 6.2088,
          destinationLng: -75.5648,
          scheduledAt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 30),
          estimatedDuration: 60,
          distanceKm: 8.5,
          totalAmount: 38250,
          pricingSnapshot: JSON.stringify({
            baseFare: 38250,
            surcharges: [],
            total: 38250
          }),
          status: 'PENDING',
          notes: 'Regreso a casa después de cita médica',
        }
      })
    ])
    console.log('✅ Citas creadas')

    // 7. CONFIGURACIÓN del sistema
    console.log('⚙️ Configurando sistema...')
    await Promise.all([
      prisma.setting.create({
        data: { key: 'business_name', value: 'Movilidad Diversa' }
      }),
      prisma.setting.create({
        data: { key: 'business_phone', value: '+57 4 123-4567' }
      }),
      prisma.setting.create({
        data: { key: 'business_email', value: 'info@movilidaddiversa.co' }
      }),
      prisma.setting.create({
        data: { key: 'work_hours_start', value: '06:00' }
      }),
      prisma.setting.create({
        data: { key: 'work_hours_end', value: '20:00' }
      }),
      prisma.setting.create({
        data: { key: 'default_appointment_duration', value: '60' }
      })
    ])
    console.log('✅ Configuración creada')

    console.log('\n🎊 ¡Datos estilo Brisk creados exitosamente!')
    console.log(`📋 ${services.length} servicios con colores`)
    console.log(`🗺️  ${zones.length} zonas`)
    console.log(`👨‍💼 ${staff.length} miembros de staff (vehículos, conductores, asistentes)`)
    console.log(`👥 ${customers.length} clientes con datos completos`)
    console.log(`📅 ${appointments.length} citas de ejemplo para hoy y mañana`)
    console.log('⚙️ 6 configuraciones del sistema')

  } catch (error) {
    console.error('❌ Error durante la siembra:', error)
    throw error
  }
}

if (require.main === module) {
  seedBriskData()
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

export { seedBriskData }