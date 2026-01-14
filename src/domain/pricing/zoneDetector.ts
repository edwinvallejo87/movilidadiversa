import { db } from '@/lib/db'
import type { Location } from './types'

export class ZoneDetector {
  async detectZone(location: Location): Promise<string | null> {
    if (location.zoneId) {
      return location.zoneId
    }

    const address = location.address.toLowerCase()
    
    const zones = await db.zone.findMany({
      where: { isActive: true }
    })

    for (const zone of zones) {
      const zoneName = zone.name.toLowerCase()
      
      if (address.includes(zoneName)) {
        return zone.id
      }
      
      if (zoneName === 'medellín' && (
        address.includes('medellin') || 
        address.includes('medellín') ||
        address.includes('el poblado') ||
        address.includes('laureles') ||
        address.includes('centro') ||
        address.includes('envigado centro') === false
      )) {
        return zone.id
      }
    }

    const municipalityKeywords = [
      'envigado', 'itagüí', 'bello', 'copacabana', 'girardota',
      'sabaneta', 'la estrella', 'caldas', 'barbosa'
    ]

    for (const keyword of municipalityKeywords) {
      if (address.includes(keyword)) {
        const zone = zones.find(z => 
          z.name.toLowerCase().includes(keyword) ||
          keyword.includes(z.name.toLowerCase())
        )
        if (zone) return zone.id
      }
    }

    return null
  }

  async detectZones(origin: Location, destination: Location): Promise<{
    fromZoneId: string | null
    toZoneId: string | null
  }> {
    const [fromZoneId, toZoneId] = await Promise.all([
      this.detectZone(origin),
      this.detectZone(destination)
    ])

    return { fromZoneId, toZoneId }
  }
}