'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
  place_id: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string, coords?: { lat: number; lng: number }) => void
  placeholder?: string
  id?: string
  required?: boolean
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Escribe una dirección...',
  id,
  required
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const wrapperRef = useRef<HTMLDivElement>(null)

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

  // Fetch suggestions from Nominatim
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length < 5) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      try {
        // Add Colombia/Antioquia context for better local results
        const searchQuery = inputValue.toLowerCase().includes('colombia')
          ? inputValue
          : `${inputValue}, Antioquia, Colombia`

        const params = new URLSearchParams({
          q: searchQuery,
          format: 'json',
          limit: '5',
          countrycodes: 'co',
          addressdetails: '1'
        })

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          {
            headers: {
              'User-Agent': 'MovilidadDiversa/1.0'
            }
          }
        )

        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
          setShowSuggestions(data.length > 0)
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

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const coords = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    }
    setInputValue(suggestion.display_name)
    onChange(suggestion.display_name, coords)
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Format display name to be shorter
  const formatAddress = (displayName: string): string => {
    const parts = displayName.split(', ')
    // Take first 3-4 parts for a cleaner display
    return parts.slice(0, 4).join(', ')
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          value={inputValue}
          onChange={handleInputChange}
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-start gap-2 border-b border-gray-100 last:border-0"
            >
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 leading-tight">
                {formatAddress(suggestion.display_name)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
