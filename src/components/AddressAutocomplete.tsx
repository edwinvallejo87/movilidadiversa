'use client'

import { useEffect, useRef } from 'react'
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete'
import { MapPin, Loader2 } from 'lucide-react'
import { useGoogleMaps } from './GoogleMapsProvider'

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
  const { isLoaded, loadError } = useGoogleMaps()
  const listRef = useRef<HTMLUListElement>(null)

  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'co' }
    },
    debounce: 300,
    initOnMount: isLoaded
  })

  // Sync external value
  useEffect(() => {
    if (value !== inputValue) {
      setValue(value, false)
    }
  }, [value])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    onChange(e.target.value)
  }

  const handleSelect = async (description: string) => {
    setValue(description, false)
    clearSuggestions()

    try {
      const results = await getGeocode({ address: description })
      const { lat, lng } = await getLatLng(results[0])
      onChange(description, { lat, lng })
    } catch (error) {
      console.error('Error getting geocode:', error)
      onChange(description)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (data.length > 0) {
        handleSelect(data[0].description)
      }
    }
  }

  if (loadError) {
    return (
      <div className="relative">
        <input
          id={id}
          value={inputValue}
          onChange={handleInput}
          placeholder={placeholder}
          required={required}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8"
        />
        <MapPin className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="relative">
        <input
          id={id}
          placeholder="Cargando..."
          disabled
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8"
        />
        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        id={id}
        value={inputValue}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={!ready}
        placeholder={ready ? placeholder : 'Cargando...'}
        required={required}
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-8"
      />
      <MapPin className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

      {/* Suggestions dropdown */}
      {status === 'OK' && (
        <ul
          ref={listRef}
          className="absolute z-[10000] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {data.map((suggestion) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text }
            } = suggestion

            return (
              <li
                key={place_id}
                onClick={() => handleSelect(suggestion.description)}
                className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <span className="font-medium text-gray-900 text-sm">{main_text}</span>
                <span className="text-gray-500 text-xs ml-1">{secondary_text}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
