'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, User, X, ChevronDown } from 'lucide-react'

interface Staff {
  id: string
  name: string
  phone?: string
  licensePlate?: string
  equipmentType: string
  color?: string
  isActive: boolean
  status: string
}

interface StaffSearchProps {
  staff: Staff[]
  value: string
  onChange: (staffId: string, equipmentType?: string) => void
  placeholder?: string
  allowNone?: boolean
}

export function StaffSearch({ staff, value, onChange, placeholder = 'Buscar conductor...', allowNone = true }: StaffSearchProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Find selected staff
  const selectedStaff = staff.find(s => s.id === value)

  // Filter available staff (active and available)
  const availableStaff = staff.filter(s => s.isActive && s.status === 'AVAILABLE')

  // Filter staff based on search
  const filteredStaff = search.trim()
    ? availableStaff.filter(member => {
        const searchLower = search.toLowerCase().trim()
        const nameMatch = member.name.toLowerCase().includes(searchLower)
        const plateMatch = member.licensePlate?.toLowerCase().includes(searchLower)
        const phoneMatch = member.phone?.includes(searchLower)
        return nameMatch || plateMatch || phoneMatch
      })
    : availableStaff

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(allowNone ? 0 : 0)
  }, [filteredStaff.length, allowNone])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    const totalItems = allowNone ? filteredStaff.length + 1 : filteredStaff.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => prev < totalItems - 1 ? prev + 1 : prev)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (allowNone && highlightedIndex === 0) {
          handleSelectStaff(null)
        } else {
          const staffIndex = allowNone ? highlightedIndex - 1 : highlightedIndex
          if (filteredStaff[staffIndex]) {
            handleSelectStaff(filteredStaff[staffIndex])
          }
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearch('')
        break
      case 'Tab':
        setIsOpen(false)
        setSearch('')
        break
    }
  }

  const handleSelectStaff = (member: Staff | null) => {
    if (member) {
      onChange(member.id, member.equipmentType)
    } else {
      onChange('', undefined)
    }
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('', undefined)
    setSearch('')
  }

  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false)
      setSearch('')
    } else {
      setIsOpen(true)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }

  const getEquipmentLabel = (type: string) => {
    const labels: Record<string, string> = { 'RAMPA': 'Rampa', 'ROBOTICA_PLEGABLE': 'Robótica' }
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <div
        className="flex items-center justify-between h-10 px-3 border border-gray-200 rounded-md bg-white cursor-pointer hover:border-gray-300 transition-colors"
        onClick={toggleDropdown}
      >
        {selectedStaff ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedStaff.color || '#3B82F6' }}
            />
            <span className="text-sm text-gray-900 truncate">{selectedStaff.name}</span>
            {selectedStaff.licensePlate && (
              <span className="text-xs text-gray-400 flex-shrink-0">({selectedStaff.licensePlate})</span>
            )}
            <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">
              {getEquipmentLabel(selectedStaff.equipmentType)}
            </Badge>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Sin asignar</span>
        )}
        <div className="flex items-center gap-1">
          {selectedStaff && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Search input inside dropdown */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="pl-9 h-9"
                autoFocus
              />
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-48 overflow-auto">
            {/* None option */}
            {allowNone && !search && (
              <div
                className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${
                  highlightedIndex === 0 ? 'bg-blue-50' : 'hover:bg-gray-50'
                } ${!value ? 'bg-blue-100' : ''}`}
                onClick={() => handleSelectStaff(null)}
                onMouseEnter={() => setHighlightedIndex(0)}
              >
                <div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
                <span className="text-sm text-gray-500">Sin asignar</span>
              </div>
            )}

            {filteredStaff.length > 0 ? (
              filteredStaff.map((member, index) => {
                const itemIndex = allowNone && !search ? index + 1 : index
                return (
                  <div
                    key={member.id}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${
                      itemIndex === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                    } ${member.id === value ? 'bg-blue-100' : ''}`}
                    onClick={() => handleSelectStaff(member)}
                    onMouseEnter={() => setHighlightedIndex(itemIndex)}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: member.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{member.name}</span>
                        {member.licensePlate && (
                          <span className="text-xs text-gray-400 flex-shrink-0">({member.licensePlate})</span>
                        )}
                      </div>
                      {member.phone && (
                        <span className="text-xs text-gray-500">{member.phone}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 flex-shrink-0">
                      {getEquipmentLabel(member.equipmentType)}
                    </Badge>
                  </div>
                )
              })
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                {search ? `No se encontraron conductores para "${search}"` : 'No hay conductores disponibles'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
