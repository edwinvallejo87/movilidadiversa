/**
 * Route Calculator using OpenStreetMap (Nominatim) and OSRM
 * Free alternative to Google Maps for geocoding and route calculation
 */

export interface Coordinates {
  lat: number
  lng: number
}

export interface GeocodingResult {
  coordinates: Coordinates
  displayName: string
  success: boolean
  error?: string
}

export interface RouteResult {
  distanceKm: number
  durationMinutes: number
  success: boolean
  error?: string
}

/**
 * Geocode an address using Nominatim (OpenStreetMap)
 * Rate limit: 1 request per second (we handle this with debounce in the UI)
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  try {
    // Add Colombia context for better results
    const searchQuery = address.toLowerCase().includes('colombia')
      ? address
      : `${address}, Antioquia, Colombia`

    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      limit: '1',
      countrycodes: 'co'
    })

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          'User-Agent': 'MovilidadDiversa/1.0 (contact@movilidaddiversa.com)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }

    const results = await response.json()

    if (!results || results.length === 0) {
      return {
        coordinates: { lat: 0, lng: 0 },
        displayName: '',
        success: false,
        error: 'No se encontro la direccion'
      }
    }

    const result = results[0]
    return {
      coordinates: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      },
      displayName: result.display_name,
      success: true
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return {
      coordinates: { lat: 0, lng: 0 },
      displayName: '',
      success: false,
      error: error instanceof Error ? error.message : 'Error de geocodificacion'
    }
  }
}

/**
 * Calculate route between two points using OSRM (Open Source Routing Machine)
 * Uses the public demo server - for production, consider self-hosting OSRM
 */
export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteResult> {
  try {
    // OSRM expects coordinates as lng,lat (not lat,lng)
    const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`,
      {
        headers: {
          'User-Agent': 'MovilidadDiversa/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Routing failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return {
        distanceKm: 0,
        durationMinutes: 0,
        success: false,
        error: 'No se pudo calcular la ruta'
      }
    }

    const route = data.routes[0]
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10, // meters to km, 1 decimal
      durationMinutes: Math.round(route.duration / 60), // seconds to minutes
      success: true
    }
  } catch (error) {
    console.error('Routing error:', error)
    return {
      distanceKm: 0,
      durationMinutes: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Error calculando ruta'
    }
  }
}

/**
 * Calculate distance between two addresses (combines geocoding + routing)
 */
export async function calculateDistanceBetweenAddresses(
  originAddress: string,
  destinationAddress: string
): Promise<{
  distanceKm: number
  durationMinutes: number
  originCoords?: Coordinates
  destinationCoords?: Coordinates
  success: boolean
  error?: string
}> {
  // Geocode both addresses in parallel
  const [originResult, destResult] = await Promise.all([
    geocodeAddress(originAddress),
    geocodeAddress(destinationAddress)
  ])

  if (!originResult.success) {
    return {
      distanceKm: 0,
      durationMinutes: 0,
      success: false,
      error: `Origen: ${originResult.error}`
    }
  }

  if (!destResult.success) {
    return {
      distanceKm: 0,
      durationMinutes: 0,
      success: false,
      error: `Destino: ${destResult.error}`
    }
  }

  // Calculate route
  const routeResult = await calculateRoute(
    originResult.coordinates,
    destResult.coordinates
  )

  if (!routeResult.success) {
    return {
      distanceKm: 0,
      durationMinutes: 0,
      originCoords: originResult.coordinates,
      destinationCoords: destResult.coordinates,
      success: false,
      error: routeResult.error
    }
  }

  return {
    distanceKm: routeResult.distanceKm,
    durationMinutes: routeResult.durationMinutes,
    originCoords: originResult.coordinates,
    destinationCoords: destResult.coordinates,
    success: true
  }
}
