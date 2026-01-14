import { Client, UnitSystem, TravelMode } from '@googlemaps/google-maps-services-js'

export interface Location {
  lat: number
  lng: number
  address?: string
}

export interface DistanceResult {
  distanceKm: number
  durationMinutes: number
  route?: {
    polyline: string
    bounds: {
      northeast: { lat: number; lng: number }
      southwest: { lat: number; lng: number }
    }
  }
}

export class DistanceCalculator {
  private client: Client

  constructor(private apiKey: string) {
    this.client = new Client({})
  }

  async calculateDistance(
    origin: Location,
    destination: Location
  ): Promise<DistanceResult> {
    try {
      const response = await this.client.distancematrix({
        params: {
          origins: [{ lat: origin.lat, lng: origin.lng }],
          destinations: [{ lat: destination.lat, lng: destination.lng }],
          units: UnitSystem.metric,
          mode: TravelMode.driving,
          key: this.apiKey,
        },
      })

      const element = response.data.rows[0]?.elements[0]
      
      if (!element || element.status !== 'OK') {
        throw new Error(`No se pudo calcular la distancia: ${element?.status || 'Error desconocido'}`)
      }

      const distanceKm = element.distance.value / 1000
      const durationMinutes = Math.ceil(element.duration.value / 60)

      return {
        distanceKm,
        durationMinutes
      }
    } catch (error) {
      console.error('Error calculating distance:', error)
      throw new Error('Error al calcular la distancia con Google Maps')
    }
  }

  async calculateDistanceWithRoute(
    origin: Location,
    destination: Location
  ): Promise<DistanceResult> {
    try {
      const response = await this.client.directions({
        params: {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          mode: TravelMode.driving,
          key: this.apiKey,
        },
      })

      const route = response.data.routes[0]
      if (!route) {
        throw new Error('No se encontró una ruta válida')
      }

      const leg = route.legs[0]
      const distanceKm = leg.distance.value / 1000
      const durationMinutes = Math.ceil(leg.duration.value / 60)

      return {
        distanceKm,
        durationMinutes,
        route: {
          polyline: route.overview_polyline.points,
          bounds: {
            northeast: route.bounds.northeast,
            southwest: route.bounds.southwest
          }
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error)
      throw new Error('Error al calcular la ruta con Google Maps')
    }
  }

  async geocodeAddress(address: string): Promise<Location> {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: this.apiKey,
        },
      })

      const result = response.data.results[0]
      if (!result) {
        throw new Error(`No se pudo geocodificar la dirección: ${address}`)
      }

      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address
      }
    } catch (error) {
      console.error('Error geocoding address:', error)
      throw new Error('Error al geocodificar la dirección')
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: this.apiKey,
        },
      })

      const result = response.data.results[0]
      if (!result) {
        throw new Error('No se pudo obtener la dirección para las coordenadas')
      }

      return result.formatted_address
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      throw new Error('Error al obtener la dirección')
    }
  }

  async searchPlaces(query: string, location?: Location): Promise<Array<{
    placeId: string
    name: string
    address: string
    location: Location
  }>> {
    try {
      const params: any = {
        query,
        key: this.apiKey,
      }

      if (location) {
        params.location = { lat: location.lat, lng: location.lng }
        params.radius = 10000 // 10km radius
      }

      const response = await this.client.textSearch({
        params,
      })

      return response.data.results
        .filter(place => place.place_id && place.name && place.formatted_address && place.geometry)
        .map(place => ({
          placeId: place.place_id!,
          name: place.name!,
          address: place.formatted_address!,
          location: {
            lat: place.geometry!.location.lat,
            lng: place.geometry!.location.lng,
            address: place.formatted_address!
          }
        }))
    } catch (error) {
      console.error('Error searching places:', error)
      throw new Error('Error al buscar lugares')
    }
  }
}