import * as XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ExcelTariffRow {
  servicio?: string
  origen?: string
  destino?: string
  tipo_ruta?: string
  modo_precio?: string
  precio_fijo?: number
  precio_por_km?: number
  precio_minimo?: number
  min_km?: number
  max_km?: number
  precio_tier?: number
}

interface ImportLog {
  errors: string[]
  warnings: string[]
  created: {
    services: number
    zones: number
    routeRules: number
    tariffRules: number
    distanceTiers: number
  }
}

export async function importTariffsFromExcel(filePath: string): Promise<ImportLog> {
  const log: ImportLog = {
    errors: [],
    warnings: [],
    created: {
      services: 0,
      zones: 0,
      routeRules: 0,
      tariffRules: 0,
      distanceTiers: 0
    }
  }

  try {
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet) as ExcelTariffRow[]

    console.log(`Procesando ${data.length} filas del archivo Excel...`)

    const serviceMap = new Map<string, string>()
    const zoneMap = new Map<string, string>()
    const routeRuleMap = new Map<string, string>()

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNum = i + 2

      try {
        if (!row.servicio?.trim()) {
          log.warnings.push(`Fila ${rowNum}: Servicio vacío, omitiendo`)
          continue
        }

        const serviceName = row.servicio.trim()
        let serviceId = serviceMap.get(serviceName)
        
        if (!serviceId) {
          let service = await prisma.service.findUnique({
            where: { name: serviceName }
          })
          
          if (!service) {
            service = await prisma.service.create({
              data: {
                name: serviceName,
                description: `Servicio importado: ${serviceName}`,
                durationMinutes: 60,
                isActive: true
              }
            })
            log.created.services++
            console.log(`✓ Servicio creado: ${serviceName}`)
          }
          
          serviceId = service.id
          serviceMap.set(serviceName, serviceId)
        }

        const originZoneName = row.origen?.trim()
        const destZoneName = row.destino?.trim()
        
        let originZoneId: string | undefined
        let destZoneId: string | undefined

        if (originZoneName) {
          originZoneId = await ensureZoneExists(originZoneName, zoneMap, log)
        }
        
        if (destZoneName) {
          destZoneId = await ensureZoneExists(destZoneName, zoneMap, log)
        }

        const routeType = mapRouteType(row.tipo_ruta?.trim() || '')
        const routeKey = `${originZoneId || 'any'}_${destZoneId || 'any'}_${routeType}`
        
        let routeRuleId = routeRuleMap.get(routeKey)
        
        if (!routeRuleId) {
          const routeRule = await prisma.routeRule.create({
            data: {
              name: `${originZoneName || 'Cualquier origen'} → ${destZoneName || 'Cualquier destino'}`,
              originZoneId,
              destinationZoneId: destZoneId,
              routeType,
              priority: 1,
              isActive: true
            }
          })
          routeRuleId = routeRule.id
          routeRuleMap.set(routeKey, routeRuleId)
          log.created.routeRules++
          console.log(`✓ Regla de ruta creada: ${routeRule.name}`)
        }

        const pricingMode = mapPricingMode(row.modo_precio?.trim() || '')
        
        const existingTariff = await prisma.tariffRule.findFirst({
          where: {
            routeRuleId,
            serviceId,
            isActive: true
          }
        })

        if (existingTariff) {
          log.warnings.push(`Fila ${rowNum}: Ya existe tarifa para ${serviceName} en esta ruta, omitiendo`)
          continue
        }

        const tariffData: any = {
          routeRuleId,
          serviceId,
          pricingMode,
          isActive: true
        }

        switch (pricingMode) {
          case 'FIXED':
            if (!row.precio_fijo) {
              log.errors.push(`Fila ${rowNum}: Precio fijo requerido para modo FIXED`)
              continue
            }
            tariffData.fixedPrice = row.precio_fijo
            break

          case 'PER_KM':
            if (!row.precio_por_km) {
              log.errors.push(`Fila ${rowNum}: Precio por km requerido para modo PER_KM`)
              continue
            }
            tariffData.pricePerKm = row.precio_por_km
            tariffData.minPrice = row.precio_minimo || 0
            break

          case 'BY_DISTANCE_TIER':
            if (!row.min_km || !row.precio_tier) {
              log.errors.push(`Fila ${rowNum}: min_km y precio_tier requeridos para modo BY_DISTANCE_TIER`)
              continue
            }
            break
        }

        const tariffRule = await prisma.tariffRule.create({
          data: tariffData
        })
        log.created.tariffRules++
        console.log(`✓ Tarifa creada: ${serviceName} - ${pricingMode}`)

        if (pricingMode === 'BY_DISTANCE_TIER' && row.min_km !== undefined && row.precio_tier) {
          const distanceTier = await prisma.distanceTier.create({
            data: {
              tariffRuleId: tariffRule.id,
              minKm: row.min_km,
              maxKm: row.max_km || null,
              price: row.precio_tier
            }
          })
          log.created.distanceTiers++
          console.log(`✓ Nivel de distancia creado: ${row.min_km}-${row.max_km || '∞'} km`)
        }

      } catch (error) {
        log.errors.push(`Fila ${rowNum}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        console.error(`Error en fila ${rowNum}:`, error)
      }
    }

    console.log('\n=== RESUMEN DE IMPORTACIÓN ===')
    console.log(`Servicios creados: ${log.created.services}`)
    console.log(`Zonas creadas: ${log.created.zones}`)
    console.log(`Reglas de ruta creadas: ${log.created.routeRules}`)
    console.log(`Tarifas creadas: ${log.created.tariffRules}`)
    console.log(`Niveles de distancia creados: ${log.created.distanceTiers}`)
    console.log(`Errores: ${log.errors.length}`)
    console.log(`Advertencias: ${log.warnings.length}`)

    if (log.errors.length > 0) {
      console.log('\n=== ERRORES ===')
      log.errors.forEach(error => console.log(`❌ ${error}`))
    }

    if (log.warnings.length > 0) {
      console.log('\n=== ADVERTENCIAS ===')
      log.warnings.forEach(warning => console.log(`⚠️  ${warning}`))
    }

  } catch (error) {
    log.errors.push(`Error leyendo archivo Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    console.error('Error general:', error)
  }

  return log
}

async function ensureZoneExists(zoneName: string, zoneMap: Map<string, string>, log: ImportLog): Promise<string> {
  let zoneId = zoneMap.get(zoneName)
  
  if (!zoneId) {
    let zone = await prisma.zone.findUnique({
      where: { name: zoneName }
    })
    
    if (!zone) {
      const zoneType = inferZoneType(zoneName)
      zone = await prisma.zone.create({
        data: {
          name: zoneName,
          type: zoneType,
          isActive: true
        }
      })
      log.created.zones++
      console.log(`✓ Zona creada: ${zoneName} (${zoneType})`)
    }
    
    zoneId = zone.id
    zoneMap.set(zoneName, zoneId)
  }
  
  return zoneId
}

function mapRouteType(tipoRuta: string): 'INTRA_ZONE' | 'MEDELLIN_TO_MUNICIPIO' | 'DESTINATION_SPECIAL' | 'OUTSIDE_GENERIC' {
  const tipo = tipoRuta.toLowerCase()
  
  if (tipo.includes('intra') || tipo.includes('dentro')) {
    return 'INTRA_ZONE'
  }
  if (tipo.includes('medellin') || tipo.includes('municipio')) {
    return 'MEDELLIN_TO_MUNICIPIO'
  }
  if (tipo.includes('especial')) {
    return 'DESTINATION_SPECIAL'
  }
  
  return 'OUTSIDE_GENERIC'
}

function mapPricingMode(modoPrecio: string): 'FIXED' | 'PER_KM' | 'BY_DISTANCE_TIER' {
  const modo = modoPrecio.toLowerCase()
  
  if (modo.includes('fijo') || modo.includes('fixed')) {
    return 'FIXED'
  }
  if (modo.includes('km') || modo.includes('kilometro')) {
    return 'PER_KM'
  }
  if (modo.includes('tier') || modo.includes('tramo') || modo.includes('nivel')) {
    return 'BY_DISTANCE_TIER'
  }
  
  return 'FIXED'
}

function inferZoneType(zoneName: string): 'CITY' | 'MUNICIPALITY' | 'OUTSIDE' {
  const name = zoneName.toLowerCase()
  
  if (name.includes('medellin') || name.includes('medellín')) {
    return 'CITY'
  }
  
  const municipalities = [
    'envigado', 'itagui', 'itagüí', 'bello', 'copacabana', 'girardota',
    'sabaneta', 'la estrella', 'caldas', 'barbosa'
  ]
  
  if (municipalities.some(mun => name.includes(mun))) {
    return 'MUNICIPALITY'
  }
  
  return 'OUTSIDE'
}

if (require.main === module) {
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('Uso: ts-node scripts/import_tariffs.ts <ruta-archivo-excel>')
    process.exit(1)
  }

  importTariffsFromExcel(filePath)
    .then(() => {
      console.log('✅ Importación completada')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error en importación:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}