'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2, Search, Plane, Building } from 'lucide-react'

interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  place_id: number
  type?: string
  class?: string
  isKnown?: boolean
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string, coords?: { lat: number; lng: number }) => void
  placeholder?: string
  id?: string
  required?: boolean
}

// Common destinations with known coordinates (bypass Nominatim for these)
const KNOWN_DESTINATIONS: Array<{ keywords: string[]; name: string; lat: number; lng: number; icon: 'plane' | 'building' }> = [
  // Out of city
  {
    keywords: ['aeropuerto', 'jmc', 'jose maria', 'cordova', 'cordoba'],
    name: 'Aeropuerto Internacional José María Córdova, Rionegro',
    lat: 6.1645,
    lng: -75.4231,
    icon: 'plane'
  },
  {
    keywords: ['rionegro centro'],
    name: 'Rionegro Centro, Antioquia',
    lat: 6.1552,
    lng: -75.3743,
    icon: 'building'
  },
  {
    keywords: ['la ceja', 'laceja'],
    name: 'La Ceja, Antioquia',
    lat: 6.0322,
    lng: -75.4261,
    icon: 'building'
  },
  {
    keywords: ['marinilla'],
    name: 'Marinilla, Antioquia',
    lat: 6.1775,
    lng: -75.3369,
    icon: 'building'
  },
  {
    keywords: ['el retiro'],
    name: 'El Retiro, Antioquia',
    lat: 6.0619,
    lng: -75.5042,
    icon: 'building'
  },
  {
    keywords: ['guatape', 'guatapé'],
    name: 'Guatapé, Antioquia',
    lat: 6.2322,
    lng: -75.1572,
    icon: 'building'
  },
  // Metropolitan area municipalities
  {
    keywords: ['itagui centro', 'itagüi centro'],
    name: 'Itagüí Centro, Antioquia',
    lat: 6.1847,
    lng: -75.5994,
    icon: 'building'
  },
  {
    keywords: ['envigado centro'],
    name: 'Envigado Centro, Antioquia',
    lat: 6.1696,
    lng: -75.5836,
    icon: 'building'
  },
  {
    keywords: ['bello centro'],
    name: 'Bello Centro, Antioquia',
    lat: 6.3378,
    lng: -75.5594,
    icon: 'building'
  },
  {
    keywords: ['sabaneta centro'],
    name: 'Sabaneta Centro, Antioquia',
    lat: 6.1515,
    lng: -75.6165,
    icon: 'building'
  },
  {
    keywords: ['la estrella centro'],
    name: 'La Estrella Centro, Antioquia',
    lat: 6.1591,
    lng: -75.6433,
    icon: 'building'
  },
  {
    keywords: ['caldas centro', 'caldas antioquia'],
    name: 'Caldas Centro, Antioquia',
    lat: 6.0896,
    lng: -75.6361,
    icon: 'building'
  },
  // Terminals
  {
    keywords: ['terminal norte'],
    name: 'Terminal de Transporte del Norte, Medellín',
    lat: 6.2723,
    lng: -75.5691,
    icon: 'building'
  },
  {
    keywords: ['terminal sur'],
    name: 'Terminal de Transporte del Sur, Medellín',
    lat: 6.2177,
    lng: -75.5866,
    icon: 'building'
  }
]

// Find matching known destinations
function findKnownDestinations(input: string): Array<{ name: string; lat: number; lng: number; icon: 'plane' | 'building' }> {
  const normalized = input.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (normalized.length < 3) return []

  return KNOWN_DESTINATIONS.filter(dest =>
    dest.keywords.some(kw => normalized.includes(kw))
  )
}

// Check if the search already contains a specific municipality (don't add Medellín context)
function hasSpecificMunicipality(input: string): boolean {
  const normalized = input.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // All municipalities in Valle de Aburrá and common out-of-city destinations
  const municipalities = [
    'itagui', 'envigado', 'bello', 'sabaneta', 'la estrella', 'caldas',
    'copacabana', 'girardota', 'barbosa',
    'rionegro', 'la ceja', 'marinilla', 'el retiro', 'guatape', 'penol',
    'santa fe de antioquia', 'aeropuerto', 'jmc'
  ]

  return municipalities.some(mun => normalized.includes(mun))
}

// Check if searching for out-of-city destination
function isOutOfCitySearch(input: string): boolean {
  const normalized = input.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const outOfCityKeywords = [
    'aeropuerto', 'rionegro', 'la ceja', 'marinilla', 'el retiro',
    'guatape', 'penol', 'santa fe', 'jmc', 'jose maria', 'cordova', 'cordoba'
  ]

  return outOfCityKeywords.some(kw => normalized.includes(kw))
}

// Normalize Colombian address format
function normalizeColombianAddress(address: string): string {
  return address.trim()
    .replace(/\bcll\b\.?/gi, 'Calle')
    .replace(/\bcra\b\.?/gi, 'Carrera')
    .replace(/\bcr\b\.?/gi, 'Carrera')
    .replace(/\bav\b\.?/gi, 'Avenida')
    .replace(/\btv\b\.?/gi, 'Transversal')
    .replace(/\bdg\b\.?/gi, 'Diagonal')
    .replace(/\bcirc\b\.?/gi, 'Circular')
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Ej: Calle 10 #30-45, Medellín',
  id,
  required
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const skipNextFetchRef = useRef(false)

  // Sync external value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch suggestions
  useEffect(() => {
    // Skip if we just selected a suggestion
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false
      return
    }

    const fetchSuggestions = async () => {
      if (inputValue.length < 4) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Check for known destinations first
      const knownMatches = findKnownDestinations(inputValue)
      const knownSuggestions: AddressSuggestion[] = knownMatches.map((dest, idx) => ({
        display_name: dest.name,
        lat: String(dest.lat),
        lon: String(dest.lng),
        place_id: -(idx + 1),
        type: dest.icon === 'plane' ? 'aerodrome' : 'city',
        class: dest.icon === 'plane' ? 'aeroway' : 'place',
        isKnown: true
      }))

      // If we have known matches, show them immediately
      if (knownSuggestions.length > 0) {
        setSuggestions(knownSuggestions)
        setShowSuggestions(true)
        setIsLoading(false)
        return
      }

      // Otherwise search Nominatim
      setIsLoading(true)
      try {
        const normalized = normalizeColombianAddress(inputValue)
        const hasSpecificMun = hasSpecificMunicipality(inputValue)
        const isOutOfCity = isOutOfCitySearch(inputValue)

        // Don't add Medellín context if user already specified a municipality
        let searchQuery: string
        if (hasSpecificMun || isOutOfCity) {
          searchQuery = `${normalized}, Antioquia, Colombia`
        } else {
          searchQuery = `${normalized}, Medellín, Antioquia, Colombia`
        }

        const params = new URLSearchParams({
          q: searchQuery,
          format: 'json',
          limit: '5',
          countrycodes: 'co',
          addressdetails: '1'
        })

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { 'User-Agent': 'MovilidadDiversa/1.0' } }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.length > 0) {
            setSuggestions(data)
            setShowSuggestions(true)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(fetchSuggestions, 500)
    return () => clearTimeout(timeoutId)
  }, [inputValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue) // Update parent without coords
  }

  const handleSelectSuggestion = useCallback((suggestion: AddressSuggestion) => {
    const coords = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    }

    // Format the address
    const displayName = suggestion.isKnown
      ? suggestion.display_name
      : formatAddress(suggestion.display_name)

    // Set flag to skip next fetch (use ref to avoid re-renders)
    skipNextFetchRef.current = true

    // Update state
    setInputValue(displayName)
    setShowSuggestions(false)
    setSuggestions([])

    // Call onChange with coords
    onChange(displayName, coords)
  }, [onChange])

  // Handle Enter key - use first suggestion or geocode
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) {
        handleSelectSuggestion(suggestions[0])
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Format display name to be shorter
  const formatAddress = (displayName: string): string => {
    const parts = displayName.split(', ')
    const filtered = parts.filter(part =>
      !['Colombia', 'Antioquia', 'Valle de Aburrá', 'RAP del Agua y la Montaña'].includes(part)
    )
    return filtered.slice(0, 4).join(', ')
  }

  // Get icon for suggestion
  const SuggestionIcon = ({ suggestion }: { suggestion: AddressSuggestion }) => {
    if (suggestion.class === 'aeroway' || suggestion.type === 'aerodrome') {
      return <Plane className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
    }
    if (suggestion.isKnown) {
      return <Building className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
    }
    return <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          required={required}
          className="pr-8"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[250px] overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 flex items-start gap-2 border-b border-gray-100 last:border-0 ${
                suggestion.isKnown ? 'bg-blue-50 hover:bg-blue-100' : ''
              }`}
            >
              <SuggestionIcon suggestion={suggestion} />
              <div className="flex-1 min-w-0">
                <span className={`leading-tight block ${suggestion.isKnown ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                  {suggestion.isKnown ? suggestion.display_name : formatAddress(suggestion.display_name)}
                </span>
                {suggestion.isKnown && (
                  <span className="text-[10px] text-blue-500">Destino conocido</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator when no suggestions yet */}
      {isLoading && suggestions.length === 0 && inputValue.length >= 4 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Buscando direcciones...</span>
          </div>
        </div>
      )}
    </div>
  )
}
