'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useLoadScript, Libraries } from '@react-google-maps/api'
import { Loader2 } from 'lucide-react'

const libraries: Libraries = ['places', 'geometry']

interface GoogleMapsContextType {
  isLoaded: boolean
  loadError: Error | undefined
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined
})

export function useGoogleMaps() {
  return useContext(GoogleMapsContext)
}

interface GoogleMapsProviderProps {
  children: ReactNode
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'es',
    region: 'CO'
  })

  if (loadError) {
    return (
      <div className="flex items-center justify-center p-4">
        <p className="text-sm text-red-500">Error cargando Google Maps</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Cargando mapa...</span>
      </div>
    )
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}
