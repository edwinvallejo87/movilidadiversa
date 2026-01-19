'use client'

import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api'
import { Loader2 } from 'lucide-react'
import { useGoogleMaps } from './GoogleMapsProvider'

interface RouteMapProps {
  originCoords?: { lat: number; lng: number }
  destinationCoords?: { lat: number; lng: number }
  onRouteCalculated?: (distance: number, duration: number) => void
  className?: string
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
}

// Medellín center
const defaultCenter = {
  lat: 6.2442,
  lng: -75.5812
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
}

export default function RouteMap({
  originCoords,
  destinationCoords,
  onRouteCalculated,
  className = ''
}: RouteMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useGoogleMaps()

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Calculate route when both coords are available
  useEffect(() => {
    if (!isLoaded || !originCoords || !destinationCoords) {
      setDirections(null)
      return
    }

    const directionsService = new google.maps.DirectionsService()

    directionsService.route(
      {
        origin: originCoords,
        destination: destinationCoords,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result)

          // Extract distance and duration
          const route = result.routes[0]
          if (route && route.legs[0]) {
            const leg = route.legs[0]
            const distanceKm = leg.distance ? leg.distance.value / 1000 : 0
            const durationMin = leg.duration ? Math.round(leg.duration.value / 60) : 0

            if (onRouteCalculated) {
              onRouteCalculated(Math.round(distanceKm * 10) / 10, durationMin)
            }
          }
        } else {
          console.error('Directions request failed:', status)
          setDirections(null)
        }
      }
    )
  }, [isLoaded, originCoords, destinationCoords, onRouteCalculated])

  // Fit bounds when coords change
  useEffect(() => {
    if (!map) return

    if (originCoords && destinationCoords) {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(originCoords)
      bounds.extend(destinationCoords)
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
    } else if (originCoords) {
      map.setCenter(originCoords)
      map.setZoom(15)
    } else if (destinationCoords) {
      map.setCenter(destinationCoords)
      map.setZoom(15)
    }
  }, [map, originCoords, destinationCoords])

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <p className="text-sm text-red-500">Error cargando el mapa</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Show markers only if no directions (directions has its own markers) */}
        {!directions && originCoords && (
          <Marker
            position={originCoords}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#22c55e',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            }}
            title="Origen"
          />
        )}

        {!directions && destinationCoords && (
          <Marker
            position={destinationCoords}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            }}
            title="Destino"
          />
        )}

        {/* Directions with route */}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-[10px] flex items-center gap-3 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white"></div>
          <span>Origen</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white"></div>
          <span>Destino</span>
        </div>
      </div>
    </div>
  )
}
