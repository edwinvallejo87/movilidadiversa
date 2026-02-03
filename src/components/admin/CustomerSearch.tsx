'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, User, X, ChevronDown } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone: string
  document?: string | null
  email?: string | null
}

interface CustomerSearchProps {
  customers: Customer[]
  value: string
  onChange: (customerId: string) => void
  placeholder?: string
}

export function CustomerSearch({ customers, value, onChange, placeholder = 'Buscar por nombre o cedula...' }: CustomerSearchProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Find selected customer
  const selectedCustomer = customers.find(c => c.id === value)

  // Filter customers based on search
  const filteredCustomers = search.trim()
    ? customers.filter(customer => {
        const searchLower = search.toLowerCase().trim()
        const nameMatch = customer.name.toLowerCase().includes(searchLower)
        const phoneMatch = customer.phone.includes(searchLower)
        const documentMatch = customer.document?.toLowerCase().includes(searchLower)
        return nameMatch || phoneMatch || documentMatch
      })
    : customers

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
    setHighlightedIndex(0)
  }, [filteredCustomers.length])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredCustomers.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCustomers[highlightedIndex]) {
          handleSelectCustomer(filteredCustomers[highlightedIndex])
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

  const handleSelectCustomer = (customer: Customer) => {
    onChange(customer.id)
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
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

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button - always visible */}
      <div
        className="flex items-center justify-between h-10 px-3 border border-gray-200 rounded-md bg-white cursor-pointer hover:border-gray-300 transition-colors"
        onClick={toggleDropdown}
      >
        {selectedCustomer ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-900 truncate">{selectedCustomer.name}</span>
            <span className="text-xs text-gray-500 flex-shrink-0">{selectedCustomer.phone}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Seleccionar cliente...</span>
        )}
        <div className="flex items-center gap-1">
          {selectedCustomer && (
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
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${
                    index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  } ${customer.id === value ? 'bg-blue-100' : ''}`}
                  onClick={() => handleSelectCustomer(customer)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{customer.name}</span>
                      {customer.document && (
                        <span className="text-xs text-gray-400 flex-shrink-0">CC: {customer.document}</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{customer.phone}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                {search ? `No se encontraron clientes para "${search}"` : 'No hay clientes disponibles'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
