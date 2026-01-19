'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface RouteMapProps {
  originCoords?: { lat: number; lng: number }
  destinationCoords?: { lat: number; lng: number }
  routeGeometry?: [number, number][]
  className?: string
}

// Custom marker icons
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

const originIcon = createIcon('#22c55e') // green
const destinationIcon = createIcon('#ef4444') // red

export default function RouteMap({
  originCoords,
  destinationCoords,
  routeGeometry,
  className = ''
}: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const routeLineRef = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map only once
    if (!mapInstanceRef.current) {
      // Default center: Medellín
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [6.2442, -75.5812],
        zoom: 12,
        zoomControl: true,
        attributionControl: true
      })

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current)
    }

    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Clear existing route
    if (routeLineRef.current) {
      routeLineRef.current.remove()
      routeLineRef.current = null
    }

    // Add origin marker
    if (originCoords) {
      const marker = L.marker([originCoords.lat, originCoords.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup('Origen')
      markersRef.current.push(marker)
    }

    // Add destination marker
    if (destinationCoords) {
      const marker = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destinationIcon })
        .addTo(map)
        .bindPopup('Destino')
      markersRef.current.push(marker)
    }

    // Add route line
    if (routeGeometry && routeGeometry.length > 0) {
      routeLineRef.current = L.polyline(routeGeometry, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8
      }).addTo(map)
    }

    // Fit bounds to show all markers and route
    if (originCoords && destinationCoords) {
      const bounds = L.latLngBounds([
        [originCoords.lat, originCoords.lng],
        [destinationCoords.lat, destinationCoords.lng]
      ])

      if (routeGeometry && routeGeometry.length > 0) {
        routeGeometry.forEach(coord => bounds.extend(coord))
      }

      map.fitBounds(bounds, { padding: [30, 30] })
    } else if (originCoords) {
      map.setView([originCoords.lat, originCoords.lng], 14)
    } else if (destinationCoords) {
      map.setView([destinationCoords.lat, destinationCoords.lng], 14)
    }

    // Cleanup on unmount
    return () => {
      // Don't destroy the map, just clean up markers and routes
    }
  }, [originCoords, destinationCoords, routeGeometry])

  // Cleanup map on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-[10px] flex items-center gap-3 shadow-sm z-[1000]">
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
