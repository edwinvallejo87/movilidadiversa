'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Calendar as CalendarIcon, User, Wrench, Car, AlertTriangle, ClipboardList, DollarSign, MapPin, Download, MessageCircle, Copy } from 'lucide-react'
import { PageHeader, CreateCustomerDialog, CustomerSearch, StaffSearch } from '@/components/admin'
import { generateReceiptPDF, ReceiptData } from '@/lib/generate-receipt-pdf'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import RouteMap from '@/components/RouteMap'
import { GoogleMapsProvider } from '@/components/GoogleMapsProvider'

// Configurar moment en español
moment.locale('es')
const localizer = momentLocalizer(moment)

interface AppointmentEvent extends Event {
  id: string
  appointmentId: string
  customerId: string
  staffId?: string
  status: string
  equipmentType: string
  customerName: string
  staffName?: string
  staffColor?: string
  totalAmount: number
  originAddress: string
  destinationAddress: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<AppointmentEvent[]>([])
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AppointmentEvent | null>(null)
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<any>(null)
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
  
  // Form data
  const [customers, setCustomers] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [formData, setFormData] = useState({
    customerId: '',
    staffId: '',
    scheduledAt: '',
    notes: '',
    estimatedAmount: 0,

    // Address fields
    originAddress: '',
    destinationAddress: '',

    // Quote system fields
    zoneSlug: 'medellin',
    tripType: 'SENCILLO',
    equipmentType: 'RAMPA',  // Auto-set from selected conductor
    originType: 'MISMO_MUNICIPIO',
    distanceKm: 0,
    outOfCityDestination: '',
    extraKm: 0,
    additionalServices: [] as any[],
    isNightSchedule: false,
    isHolidayOrSunday: false
  })

  // Quote system data
  const [pricingZones, setPricingZones] = useState<any[]>([])
  const [additionalServicesList, setAdditionalServicesList] = useState<any[]>([])
  const [outOfCityDestinations, setOutOfCityDestinations] = useState<string[]>([])
  const [currentQuote, setCurrentQuote] = useState<any>(null)
  const [showQuoteBreakdown, setShowQuoteBreakdown] = useState(false)
  const [rateNotFoundError, setRateNotFoundError] = useState<string | null>(null)
  
  // Availability checking
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<any>(null)

  // Post-creation receipt download
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null)
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false)

  // Route calculation (handled by Google Maps RouteMap component)
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null)
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Zone detection from address
  const detectZoneFromAddress = (address: string): string | null => {
    if (!address) return null
    const addr = address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents

    // Out of city destinations
    const outOfCityKeywords = ['aeropuerto', 'jmc', 'jose maria', 'rionegro', 'la ceja', 'marinilla', 'el retiro', 'abejorral', 'carmen de viboral', 'guatape', 'penol', 'santa fe de antioquia']
    if (outOfCityKeywords.some(kw => addr.includes(kw))) {
      return 'fuera-ciudad'
    }

    // Medellín
    const medellinKeywords = ['medellin', 'poblado', 'laureles', 'estadio', 'belen', 'floresta', 'calasanz', 'robledo', 'castilla', 'aranjuez', 'manrique', 'buenos aires', 'la america', 'san javier', 'guayabal', 'centro medellin']
    if (medellinKeywords.some(kw => addr.includes(kw))) {
      return 'medellin'
    }

    // Bello, Itagüí, Envigado
    const belloItaguiEnvigadoKeywords = ['bello', 'itagui', 'envigado', 'niquia', 'copacabana']
    if (belloItaguiEnvigadoKeywords.some(kw => addr.includes(kw))) {
      return 'bello-itagui-envigado'
    }

    // Sabaneta
    if (addr.includes('sabaneta')) {
      return 'sabaneta'
    }

    // La Estrella, Caldas
    const estrellaCaldasKeywords = ['la estrella', 'caldas', 'estrella']
    if (estrellaCaldasKeywords.some(kw => addr.includes(kw))) {
      return 'la-estrella-caldas'
    }

    return null
  }

  // Detect origin type based on origin and destination zones
  const detectOriginType = (originZone: string | null, destZone: string | null): string => {
    // If origin is Medellín and destination is out-of-city
    if (originZone === 'medellin' && destZone === 'fuera-ciudad') {
      return 'DESDE_MEDELLIN'
    }
    // If destination is Medellín and origin is out-of-city
    if (destZone === 'medellin' && originZone === 'fuera-ciudad') {
      return 'DESDE_MEDELLIN'
    }
    // If origin is Medellín and destination is different metro zone
    if (originZone === 'medellin' && destZone && destZone !== 'medellin') {
      return 'DESDE_MEDELLIN'
    }
    // If destination is Medellín and origin is different metro zone
    if (destZone === 'medellin' && originZone && originZone !== 'medellin') {
      return 'DESDE_MEDELLIN'
    }
    // Same municipality or other cases
    return 'MISMO_MUNICIPIO'
  }

  // Detect out-of-city destination name from address (must match DB values exactly)
  const detectOutOfCityDestination = (address: string): string => {
    if (!address) return ''
    const addr = address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    // Must return exact names from database: "Aeropuerto JMC", "Rionegro", "La Ceja"
    if (addr.includes('aeropuerto') || addr.includes('jmc') || addr.includes('jose maria') || addr.includes('cordova') || addr.includes('cordoba')) {
      return 'Aeropuerto JMC'
    }
    if (addr.includes('rionegro') && !addr.includes('aeropuerto')) return 'Rionegro'
    if (addr.includes('la ceja')) return 'La Ceja'

    return ''
  }

  // Auto-detect zone when addresses change
  useEffect(() => {
    const originZone = detectZoneFromAddress(formData.originAddress)
    const destZone = detectZoneFromAddress(formData.destinationAddress)

    // Determine the primary zone for pricing:
    // - If out-of-city, use that
    // - If one is Medellín and the other is peripheral, use the peripheral zone
    // - Otherwise use whichever is detected
    let detectedZone: string | null = null

    // If either is out-of-city, prioritize that
    if (originZone === 'fuera-ciudad' || destZone === 'fuera-ciudad') {
      detectedZone = 'fuera-ciudad'
    }
    // If one is Medellín and other is peripheral, use the peripheral zone
    else if (originZone === 'medellin' && destZone && destZone !== 'medellin') {
      detectedZone = destZone
    }
    else if (destZone === 'medellin' && originZone && originZone !== 'medellin') {
      detectedZone = originZone
    }
    // Otherwise use whatever is detected (origin first, then dest)
    else {
      detectedZone = originZone || destZone
    }

    // Update when zone changes
    if (detectedZone && detectedZone !== formData.zoneSlug) {
      const originType = detectOriginType(originZone, destZone)
      const outOfCityDest = detectedZone === 'fuera-ciudad'
        ? detectOutOfCityDestination(formData.destinationAddress) || detectOutOfCityDestination(formData.originAddress)
        : ''

      setFormData(prev => ({
        ...prev,
        zoneSlug: detectedZone!,
        originType,
        outOfCityDestination: outOfCityDest
      }))

      // Show toast to inform user
      const zoneNames: Record<string, string> = {
        'medellin': 'Medellín',
        'bello-itagui-envigado': 'Bello/Itagüí/Envigado',
        'sabaneta': 'Sabaneta',
        'la-estrella-caldas': 'La Estrella/Caldas',
        'fuera-ciudad': 'Fuera de Ciudad'
      }
      toast.info(`Zona detectada: ${zoneNames[detectedZone] || detectedZone}`)
    }
  }, [formData.originAddress, formData.destinationAddress])

  // Callback when Google Maps calculates the route
  const handleRouteCalculated = (distanceKm: number, durationMinutes: number) => {
    setFormData(prev => ({
      ...prev,
      distanceKm
    }))
    setEstimatedDuration(durationMinutes)
    toast.success(`Distancia: ${distanceKm} km (~${durationMinutes} min)`)
  }

  useEffect(() => {
    loadAppointments()
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [customersRes, staffRes, pricingZonesRes, additionalServicesRes, destinationsRes] = await Promise.all([
        fetch('/api/admin/clients'),
        fetch('/api/admin/staff'),
        fetch('/api/quotes/calculate?type=zones'),
        fetch('/api/quotes/calculate?type=additional-services'),
        fetch('/api/quotes/calculate?type=out-of-city-destinations')
      ])

      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData.customers || [])
      }
      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStaff(Array.isArray(staffData) ? staffData : [])
      }
      if (pricingZonesRes.ok) {
        const pricingZonesData = await pricingZonesRes.json()
        setPricingZones(Array.isArray(pricingZonesData) ? pricingZonesData : [])
      }
      if (additionalServicesRes.ok) {
        const additionalServicesData = await additionalServicesRes.json()
        setAdditionalServicesList(Array.isArray(additionalServicesData) ? additionalServicesData : [])
      }
      if (destinationsRes.ok) {
        const destinationsData = await destinationsRes.json()
        setOutOfCityDestinations(Array.isArray(destinationsData) ? destinationsData : [])
      }
    } catch (error) {
      console.error('Error loading form data:', error)
    }
  }

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/appointments?include=all')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()

      // Handle both array response and { appointments: [...] } format
      const appointmentsArray = Array.isArray(data) ? data : (data?.appointments || [])

      const appointmentEvents: AppointmentEvent[] = appointmentsArray.map((apt: any) => {
        // Get equipment type from staff or fallback
        const equipmentType = apt.staff?.equipmentType || 'RAMPA'
        const equipmentLabel = equipmentType === 'ROBOTICA_PLEGABLE' ? 'Robótica' : 'Rampa'

        // Title: Customer - Equipment Type (Driver)
        let title = `${apt.customer.name} - ${equipmentLabel}`
        if (apt.staff?.name) {
          title += ` (${apt.staff.name})`
        }

        return {
          id: apt.id,
          appointmentId: apt.id,
          title,
          start: new Date(apt.scheduledAt),
          end: new Date(new Date(apt.scheduledAt).getTime() + (apt.estimatedDuration || 60) * 60000),
          customerId: apt.customerId,
          staffId: apt.staffId,
          status: apt.status,
          equipmentType,
          customerName: apt.customer.name,
          staffName: apt.staff?.name || 'Sin asignar',
          staffColor: apt.staff?.color || '#3B82F6',
          totalAmount: apt.totalAmount,
          originAddress: apt.originAddress || '',
          destinationAddress: apt.destinationAddress || ''
        }
      })

      setEvents(appointmentEvents)
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Error al cargar las citas - Verifica la configuración de autenticación')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const eventStyleGetter = (event: AppointmentEvent) => {
    // Use staff color for the event background
    const staffColor = event.staffColor || '#3B82F6'

    // Adjust opacity based on status
    let opacity = 1
    if (event.status === 'CANCELLED') opacity = 0.4
    if (event.status === 'COMPLETED') opacity = 0.7

    return {
      style: {
        backgroundColor: staffColor,
        border: 'none',
        borderRadius: '3px',
        padding: '2px 6px',
        fontSize: '11px',
        fontWeight: '500',
        color: 'white',
        opacity
      }
    }
  }

  const handleSelectEvent = async (event: AppointmentEvent) => {
    setSelectedEvent(event)
    setShowDetailsModal(true)

    // Fetch full appointment details including pricingSnapshot
    try {
      const response = await fetch(`/api/appointments/${event.appointmentId}`)
      if (response.ok) {
        const appointmentData = await response.json()
        setSelectedAppointmentDetails(appointmentData)
      }
    } catch {
      // Silently fail - we still have basic event data
    }
  }

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo)
    setFormData({
      ...formData,
      scheduledAt: moment(slotInfo.start).format('YYYY-MM-DDTHH:mm')
    })
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setFormData({
      customerId: '',
      staffId: '',
      scheduledAt: '',
      notes: '',
      estimatedAmount: 0,
      originAddress: '',
      destinationAddress: '',
      zoneSlug: 'medellin',
      tripType: 'SENCILLO',
      equipmentType: 'RAMPA',
      originType: 'MISMO_MUNICIPIO',
      distanceKm: 0,
      outOfCityDestination: '',
      extraKm: 0,
      additionalServices: [],
      isNightSchedule: false,
      isHolidayOrSunday: false
    })
    setAvailabilityStatus(null)
    setCurrentQuote(null)
    setShowQuoteBreakdown(false)
    setIsEditMode(false)
    setEditingAppointmentId(null)
    setEstimatedDuration(null)
    setOriginCoords(null)
    setDestinationCoords(null)
  }

  const checkAvailability = async () => {
    if (!formData.scheduledAt || !formData.staffId) {
      setAvailabilityStatus(null)
      return
    }

    const startDateTime = new Date(formData.scheduledAt)
    // Default duration: 60 minutes
    const endDateTime = new Date(startDateTime.getTime() + (60 * 60000))

    setIsCheckingAvailability(true)
    try {
      const params = new URLSearchParams({
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      })

      if (formData.staffId && formData.staffId !== 'none') params.append('staffId', formData.staffId)

      const response = await fetch(`/api/availability/check?${params}`)
      if (response.ok) {
        const availability = await response.json()
        setAvailabilityStatus(availability)
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setIsCheckingAvailability(false)
    }
  }

  // Check availability when relevant fields change
  React.useEffect(() => {
    if (formData.staffId) {
      const timeoutId = setTimeout(checkAvailability, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setAvailabilityStatus(null)
    }
  }, [formData.staffId, formData.scheduledAt])

  const calculateQuote = async () => {
    // Check if we have the minimum required data
    if (!formData.zoneSlug || !formData.tripType || !formData.equipmentType) {
      setCurrentQuote(null)
      setFormData(prev => ({...prev, estimatedAmount: 0}))
      setRateNotFoundError(null)
      return
    }

    // For out-of-city zone, destination is required
    if (formData.zoneSlug === 'fuera-ciudad' && !formData.outOfCityDestination) {
      setCurrentQuote(null)
      setFormData(prev => ({...prev, estimatedAmount: 0}))
      setShowQuoteBreakdown(false)
      setRateNotFoundError(null)
      return
    }

    // Clear previous error when starting new calculation
    setRateNotFoundError(null)

    try {
      const quoteRequest: any = {
        zoneSlug: formData.zoneSlug,
        tripType: formData.tripType,
        equipmentType: formData.equipmentType,
        additionalServices: formData.additionalServices,
        scheduledAt: formData.scheduledAt || undefined // API will calculate night/holiday
      }

      // Add optional fields only if they have valid values
      if (formData.zoneSlug !== 'medellin' && formData.originType) {
        quoteRequest.originType = formData.originType
      }
      if (formData.zoneSlug === 'medellin' && formData.distanceKm !== undefined) {
        quoteRequest.distanceKm = formData.distanceKm
      }
      if (formData.outOfCityDestination) {
        quoteRequest.outOfCityDestination = formData.outOfCityDestination
      }
      if (formData.extraKm && formData.extraKm > 0) {
        quoteRequest.extraKm = formData.extraKm
      }

      const response = await fetch('/api/quotes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteRequest)
      })

      if (response.ok) {
        const quote = await response.json()
        setCurrentQuote(quote)
        setFormData(prev => ({
          ...prev,
          estimatedAmount: quote.totalPrice
        }))
        setShowQuoteBreakdown(true)
        setRateNotFoundError(null)
      } else {
        // Rate not found for this combination
        const errorData = await response.json().catch(() => ({}))
        setCurrentQuote(null)
        setFormData(prev => ({...prev, estimatedAmount: 0}))
        setShowQuoteBreakdown(false)
        setRateNotFoundError(errorData.error || 'Tarifa no encontrada para esta combinación')
      }
    } catch (error) {
      // Network or other error
      setCurrentQuote(null)
      setFormData(prev => ({...prev, estimatedAmount: 0}))
      setShowQuoteBreakdown(false)
      setRateNotFoundError('Error al calcular la tarifa')
    }
  }

  // Función auxiliar para calcular precios usando Zonas y TariffRules de la BD
  const calculatePriceByZone = async (origin: string, destination: string, serviceId: string) => {
    try {
      // Llamar al API para calcular tarifa usando las zonas de la BD
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originAddress: origin,
          destinationAddress: destination,
          serviceId: serviceId
        })
      })

      if (response.ok) {
        const pricing = await response.json()
        return pricing.estimatedPrice || 15000
      }
    } catch (error) {
      console.warn('Error calculando precio por zona, usando fallback:', error)
    }

    // Fallback: precio base si falla la consulta a la BD
    return 15000
  }

  // Calcular cotización cuando cambian los campos relevantes (con debounce)
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateQuote()
    }, 500) // Debounce de 500ms
    
    return () => clearTimeout(timeoutId)
  }, [formData.zoneSlug, formData.tripType, formData.equipmentType, formData.originType, formData.distanceKm, formData.outOfCityDestination, formData.extraKm, formData.additionalServices, formData.scheduledAt])

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId || !formData.scheduledAt) {
      toast.error('Por favor complete todos los campos obligatorios')
      return
    }

    if (!formData.originAddress || !formData.destinationAddress) {
      toast.error('Por favor ingrese las direcciones de origen y destino')
      return
    }

    // Check availability first if staff is assigned
    if (availabilityStatus && !availabilityStatus.available) {
      toast.error('El conductor seleccionado no está disponible en ese horario')
      return
    }

    try {
      // Get equipment type from selected staff
      const selectedStaff = staff.find(s => s.id === formData.staffId)
      const equipmentType = selectedStaff?.equipmentType || formData.equipmentType

      // Create appointment payload with actual addresses
      const appointmentPayload = {
        customerId: formData.customerId,
        staffId: formData.staffId || undefined,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        originAddress: formData.originAddress,
        destinationAddress: formData.destinationAddress,
        notes: formData.notes,
        estimatedAmount: formData.estimatedAmount,
        distanceKm: formData.distanceKm || 0,
        pricingBreakdown: currentQuote?.breakdown || undefined,
        equipmentType
      }

      const response = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentPayload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la cita')
      }

      toast.success('Cita creada exitosamente')
      setShowCreateModal(false)
      resetForm()
      loadAppointments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la cita')
    }
  }

  // Handle opening edit mode - loads data into create form
  const handleOpenEdit = async () => {
    if (!selectedEvent) return

    try {
      // Fetch full appointment data
      const response = await fetch(`/api/appointments/${selectedEvent.appointmentId}`)
      if (!response.ok) throw new Error('Error al cargar cita')

      const appointment = await response.json()

      // Extract additional services from pricingSnapshot
      let savedAdditionalServices: any[] = []
      if (appointment.pricingSnapshot) {
        try {
          const pricingData = typeof appointment.pricingSnapshot === 'string'
            ? JSON.parse(appointment.pricingSnapshot)
            : appointment.pricingSnapshot

          if (pricingData.breakdown && Array.isArray(pricingData.breakdown)) {
            // Find items that are additional services (have type or code, or match by name)
            savedAdditionalServices = pricingData.breakdown
              .filter((item: any) => {
                // If it has type 'additional_service', use it
                if (item.type === 'additional_service') return true
                // Otherwise try to match by name with available services
                if (item.code) return true
                // Try to find in additionalServicesList by name
                return additionalServicesList.some(s => s.name === item.item)
              })
              .map((item: any) => {
                // If it has a code, use it directly
                if (item.code) {
                  return { code: item.code, quantity: item.quantity || 1 }
                }
                // Otherwise find by name
                const matchedService = additionalServicesList.find(s => s.name === item.item)
                if (matchedService) {
                  return { code: matchedService.code, quantity: item.quantity || 1 }
                }
                return null
              })
              .filter(Boolean)
          }
        } catch {
          // Ignore parsing errors
        }
      }

      // Pre-fill form with appointment data
      setFormData({
        customerId: appointment.customerId || '',
        staffId: appointment.staffId || '',
        scheduledAt: moment(appointment.scheduledAt).format('YYYY-MM-DDTHH:mm'),
        notes: appointment.notes || '',
        estimatedAmount: appointment.totalAmount || 0,
        originAddress: appointment.originAddress || '',
        destinationAddress: appointment.destinationAddress || '',
        zoneSlug: 'medellin', // Will be auto-detected from address
        tripType: 'SENCILLO',
        equipmentType: appointment.equipmentType || 'RAMPA',
        originType: 'MISMO_MUNICIPIO',
        distanceKm: appointment.distanceKm || 0,
        outOfCityDestination: '',
        extraKm: 0,
        additionalServices: savedAdditionalServices,
        isNightSchedule: false,
        isHolidayOrSunday: false
      })

      setEditingAppointmentId(selectedEvent.appointmentId)
      setIsEditMode(true)
      setShowDetailsModal(false)
      setShowCreateModal(true)
    } catch (error) {
      toast.error('Error al cargar datos de la cita')
    }
  }

  // Handle new customer created from dialog
  const handleCustomerCreated = (newCustomer: { id: string; name: string; phone: string }) => {
    setCustomers(prev => [...prev, newCustomer])
    setFormData(prev => ({ ...prev, customerId: newCustomer.id }))
    toast.info(`Cliente "${newCustomer.name}" seleccionado`)
  }

  // Handle create or update appointment
  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validación con mensajes específicos
    if (!formData.customerId) {
      toast.error('Debe seleccionar un cliente')
      return
    }

    if (!formData.scheduledAt) {
      toast.error('Debe seleccionar fecha y hora')
      return
    }

    if (!formData.originAddress) {
      toast.error('Debe ingresar la dirección de origen')
      return
    }

    if (!formData.destinationAddress) {
      toast.error('Debe ingresar la dirección de destino')
      return
    }

    // Check availability first if staff is assigned
    if (availabilityStatus && !availabilityStatus.available && !isEditMode) {
      toast.error('El conductor seleccionado no está disponible en ese horario')
      return
    }

    try {
      // Get equipment type from selected staff
      const selectedStaff = staff.find(s => s.id === formData.staffId)
      const equipmentType = selectedStaff?.equipmentType || formData.equipmentType

      const payload: Record<string, unknown> = {
        customerId: formData.customerId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        originAddress: formData.originAddress,
        destinationAddress: formData.destinationAddress,
        notes: formData.notes,
        estimatedAmount: formData.estimatedAmount,
        distanceKm: formData.distanceKm || 0,
        pricingBreakdown: currentQuote?.breakdown || undefined,
        equipmentType
      }

      // Solo agregar staffId si está seleccionado
      if (formData.staffId) {
        payload.staffId = formData.staffId
      }

      let response
      if (isEditMode && editingAppointmentId) {
        // Update existing appointment
        response = await fetch(`/api/appointments/${editingAppointmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        // Create new appointment
        response = await fetch('/api/admin/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar')
      }

      toast.success(isEditMode ? 'Cita actualizada' : 'Cita creada')
      setShowCreateModal(false)

      // Show receipt download option only for new appointments
      if (!isEditMode && result.id) {
        setCreatedAppointmentId(result.id)
        setShowReceiptModal(true)
      }

      setIsEditMode(false)
      setEditingAppointmentId(null)
      resetForm()
      loadAppointments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  // Handle quick status change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent) return

    try {
      const response = await fetch(`/api/appointments/${selectedEvent.appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }

      toast.success(`Estado cambiado a ${newStatus}`)
      setShowDetailsModal(false)
      setSelectedAppointmentDetails(null)
      loadAppointments()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (!selectedEvent) return
    if (!confirm('¿Cancelar esta cita?')) return

    await handleStatusChange('CANCELLED')
  }

  // Get status label in Spanish
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'SCHEDULED': 'Programada',
      'CONFIRMED': 'Confirmada',
      'IN_PROGRESS': 'En Progreso',
      'COMPLETED': 'Completada',
      'CANCELLED': 'Cancelada'
    }
    return labels[status] || status
  }

  // Download receipt for an appointment
  const handleDownloadReceipt = async (appointmentId: string) => {
    setIsDownloadingReceipt(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (!response.ok) throw new Error('Error al cargar cita')

      const appointment = await response.json()

      // Parse pricingSnapshot if it's a string
      let pricingData = undefined
      if (appointment.pricingSnapshot) {
        try {
          pricingData = typeof appointment.pricingSnapshot === 'string'
            ? JSON.parse(appointment.pricingSnapshot)
            : appointment.pricingSnapshot
        } catch {
          pricingData = undefined
        }
      }

      const receiptData: ReceiptData = {
        id: appointment.id,
        scheduledAt: appointment.scheduledAt,
        originAddress: appointment.originAddress || '',
        destinationAddress: appointment.destinationAddress || '',
        distanceKm: appointment.distanceKm,
        equipmentType: appointment.equipmentType || 'RAMPA',
        totalAmount: appointment.totalAmount || 0,
        pricingSnapshot: pricingData,
        customer: {
          name: appointment.customer?.name || 'Cliente',
          phone: appointment.customer?.phone,
          email: appointment.customer?.email,
        },
      }

      await generateReceiptPDF(receiptData)
      toast.success('Recibo descargado')
    } catch (error) {
      console.error('Error downloading receipt:', error)
      toast.error('Error al descargar recibo')
    } finally {
      setIsDownloadingReceipt(false)
    }
  }

  // Generate service order text for WhatsApp
  const generateServiceOrderText = (event: AppointmentEvent) => {
    const scheduledDate = moment(event.start).format('dddd D [de] MMMM')
    const scheduledTime = moment(event.start).format('h:mm A')

    // Find full customer and staff data
    const customer = customers.find(c => c.id === event.customerId)
    const staffMember = staff.find(s => s.id === event.staffId)

    let text = `*SERVICIO PROGRAMADO*\n\n`

    text += `Fecha: ${scheduledDate.charAt(0).toUpperCase() + scheduledDate.slice(1)}\n`
    text += `Hora: ${scheduledTime}\n\n`

    text += `------------------------\n\n`

    text += `*CLIENTE*\n`
    text += `${event.customerName}\n`
    if (customer?.phone) {
      text += `Tel: ${customer.phone}\n`
    }
    text += `\n`

    text += `*RECOGER EN:*\n`
    text += `${event.originAddress}\n\n`

    text += `*LLEVAR A:*\n`
    text += `${event.destinationAddress}\n\n`

    text += `------------------------\n\n`

    text += `Vehiculo: ${event.equipmentType === 'RAMPA' ? 'Rampa' : event.equipmentType === 'ROBOTICA_PLEGABLE' ? 'Robotica' : event.equipmentType}\n`

    // Extract additional services from pricingSnapshot
    if (selectedAppointmentDetails?.pricingSnapshot) {
      try {
        const pricingData = typeof selectedAppointmentDetails.pricingSnapshot === 'string'
          ? JSON.parse(selectedAppointmentDetails.pricingSnapshot)
          : selectedAppointmentDetails.pricingSnapshot

        if (pricingData.breakdown && Array.isArray(pricingData.breakdown)) {
          // Items to exclude (base rates, km charges, surcharges)
          const excludePatterns = [
            /viaje.*sencillo/i,
            /viaje.*doble/i,
            /viaje.*redondo/i,
            /tarifa.*base/i,
            /kilometro/i,
            /km.*adicional/i,
            /recargo.*nocturno/i,
            /recargo.*dominical/i,
            /recargo.*festivo/i
          ]

          const additionalServices = pricingData.breakdown.filter((item: any) => {
            // If it has type 'additional_service', include it
            if (item.type === 'additional_service') return true
            // If it has a code that matches our additional services list
            if (item.code && additionalServicesList.some(s => s.code === item.code)) return true
            // If the name matches an additional service
            if (additionalServicesList.some(s => s.name === item.item)) return true
            // Exclude known base rate / surcharge patterns
            if (excludePatterns.some(pattern => pattern.test(item.item))) return false
            // Include items that look like additional services (silla robotica, espera, etc)
            if (/silla.*robot|espera|acompan|piso/i.test(item.item)) return true
            return false
          })

          if (additionalServices.length > 0) {
            text += `\n*SERVICIOS ADICIONALES:*\n`
            additionalServices.forEach((svc: any) => {
              const qty = svc.quantity && svc.quantity > 1 ? ` x${svc.quantity}` : ''
              text += `- ${svc.item}${qty}\n`
            })
          }
        }
      } catch {
        // Ignore parsing errors
      }
    }

    if (customer) {
      const hasCustomerData = customer.age || customer.weight || customer.wheelchairType || customer.emergencyContact
      if (hasCustomerData) {
        text += `\n*DATOS DEL PASAJERO:*\n`
        if (customer.age) text += `Edad: ${customer.age} anos\n`
        if (customer.weight) text += `Peso: ${customer.weight} kg\n`
        if (customer.wheelchairType && customer.wheelchairType !== 'none') {
          const wheelchairLabels: Record<string, string> = {
            'manual-plegable': 'Manual plegable',
            'manual-rigida': 'Manual rigida',
            'electrica': 'Electrica/Motorizada',
            'traslado': 'De traslado',
            'bariatrica': 'Bariatrica',
            'neurologica': 'Neurologica/Postural',
          }
          text += `Silla: ${wheelchairLabels[customer.wheelchairType] || customer.wheelchairType}\n`
        }
        if (customer.emergencyContact) {
          text += `Emergencia: ${customer.emergencyContact}\n`
        }
      }
    }

    text += `\n------------------------\n`
    text += `Confirmar recibido`

    return text
  }

  const handleCopyServiceOrder = async () => {
    if (!selectedEvent) return

    const text = generateServiceOrderText(selectedEvent)
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Orden copiada al portapapeles')
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  const handleSendWhatsApp = () => {
    if (!selectedEvent) return

    const staffMember = staff.find(s => s.id === selectedEvent.staffId)
    const text = generateServiceOrderText(selectedEvent)
    const encodedText = encodeURIComponent(text)

    if (staffMember?.phone) {
      let phone = staffMember.phone.replace(/\D/g, '')
      if (!phone.startsWith('57') && phone.length === 10) {
        phone = '57' + phone
      }
      window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank')
    } else {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          <p className="mt-2 text-sm text-gray-500">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Calendario de Citas"
        description="Gestiona todas las citas y horarios de tu equipo"
      />

      {/* Toolbar del calendario */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
        {/* Navegación de fecha */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <Button size="sm" variant="ghost" onClick={() => {
              const newDate = moment(date).subtract(1, view === 'day' ? 'day' : view === 'week' ? 'week' : 'month').toDate()
              setDate(newDate)
            }}>
              ←
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDate(new Date())}>
              Hoy
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              const newDate = moment(date).add(1, view === 'day' ? 'day' : view === 'week' ? 'week' : 'month').toDate()
              setDate(newDate)
            }}>
              →
            </Button>
          </div>
          <span className="text-sm font-medium text-gray-900 ml-2">
            {view === 'day' && moment(date).format('dddd, D MMMM YYYY')}
            {view === 'week' && `${moment(date).startOf('week').format('D MMM')} - ${moment(date).endOf('week').format('D MMM YYYY')}`}
            {view === 'month' && moment(date).format('MMMM YYYY')}
          </span>
        </div>

        {/* Vista */}
        <div className="flex gap-0.5 bg-gray-50 p-0.5 rounded">
          <Button size="sm" variant={view === 'day' ? 'default' : 'ghost'} onClick={() => setView('day')}>
            Día
          </Button>
          <Button size="sm" variant={view === 'week' ? 'default' : 'ghost'} onClick={() => setView('week')}>
            Semana
          </Button>
          <Button size="sm" variant={view === 'month' ? 'default' : 'ghost'} onClick={() => setView('month')}>
            Mes
          </Button>
        </div>
      </div>

      {/* Leyenda de estados */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Programado
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Confirmado
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> En Progreso
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Completado
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Cancelado
          </span>
        </div>
        <p className="text-[10px] text-gray-400">Clic en horario para nueva cita</p>
      </div>

      {/* Calendario */}
      <div className="bg-white border border-gray-100 rounded overflow-hidden" style={{ height: '600px' }}>
        <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            popup
            showMultiDayTimes
            step={15}
            timeslots={4}
            toolbar={false}
            min={moment().hour(6).minute(0).toDate()}
            max={moment().hour(22).minute(0).toDate()}
            messages={{
              next: "Siguiente",
              previous: "Anterior",
              today: "Hoy",
              month: "Mes",
              week: "Semana",
              day: "Día",
              agenda: "Agenda",
              date: "Fecha",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "No hay citas en este rango",
              showMore: (total) => `+${total} más`
            }}
            formats={{
              dayHeaderFormat: 'dddd DD/MM',
              dayRangeHeaderFormat: ({ start, end }) =>
                `${moment(start).format('DD/MM')} - ${moment(end).format('DD/MM YYYY')}`,
              monthHeaderFormat: 'MMMM YYYY',
              timeGutterFormat: 'HH:mm',
              eventTimeRangeFormat: ({ start, end }) =>
                `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
            }}
          />
      </div>

      {/* Modal de creación de cita */}
      <Dialog modal={false} open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">
              {isEditMode ? 'Editar Cita' : 'Nueva Cita'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEditMode
                ? `Editando cita del ${moment(formData.scheduledAt).format('ddd D MMM, HH:mm')}`
                : selectedSlot && moment(selectedSlot.start).format('ddd D MMM, HH:mm')
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitAppointment} className="space-y-3">
            <div>
              <Label htmlFor="customerId">Cliente *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CustomerSearch
                    customers={customers}
                    value={formData.customerId}
                    onChange={(value) => {
                      const selectedCustomer = customers.find(c => c.id === value)

                      // Construir notas con datos del cliente
                      let autoNotes = ''
                      if (selectedCustomer) {
                        const infoParts = []
                        if (selectedCustomer.age) infoParts.push(`Edad: ${selectedCustomer.age} años`)
                        if (selectedCustomer.weight) infoParts.push(`Peso: ${selectedCustomer.weight} kg`)
                        if (selectedCustomer.wheelchairType) {
                          const wheelchairLabels: Record<string, string> = {
                            'MANUAL_PLEGABLE': 'Manual plegable',
                            'MANUAL_RIGIDA': 'Manual rígida',
                            'ELECTRICA': 'Eléctrica/Motorizada',
                            'TRANSPORTE': 'De traslado',
                            'BARIATRICA': 'Bariátrica',
                            'NEUROLOGICA': 'Neurológica/Postural',
                            'NO_TIENE': 'No tiene silla'
                          }
                          infoParts.push(`Silla: ${wheelchairLabels[selectedCustomer.wheelchairType] || selectedCustomer.wheelchairType}`)
                        }
                        if (selectedCustomer.emergencyContact) {
                          infoParts.push(`Emergencia: ${selectedCustomer.emergencyContact}`)
                        }
                        if (infoParts.length > 0) {
                          autoNotes = infoParts.join(' | ')
                        }
                      }

                      setFormData({
                        ...formData,
                        customerId: value,
                        notes: autoNotes
                      })
                    }}
                    placeholder="Buscar por nombre, cedula o telefono..."
                  />
                </div>
                <CreateCustomerDialog onCustomerCreated={handleCustomerCreated} />
              </div>
            </div>

            <div>
              <Label htmlFor="staffId">Conductor + Vehículo</Label>
              <StaffSearch
                staff={staff}
                value={formData.staffId}
                onChange={(staffId, equipmentType) => {
                  setFormData({
                    ...formData,
                    staffId: staffId,
                    equipmentType: equipmentType || 'RAMPA'
                  })
                }}
                placeholder="Buscar por nombre o placa..."
              />
            </div>

            {/* Show selected equipment type */}
            {formData.staffId && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded text-xs">
                <Car className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-blue-700">
                  Tipo de equipo: <strong>{formData.equipmentType === 'ROBOTICA_PLEGABLE' ? 'Silla Robótica/Plegable' : 'Vehículo con Rampa'}</strong>
                </span>
              </div>
            )}

            {/* Direcciones y Mapa */}
            <GoogleMapsProvider>
              <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-3">
                <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Direcciones y Ruta
                </h3>

                {/* Map - always visible */}
                <RouteMap
                  originCoords={originCoords || undefined}
                  destinationCoords={destinationCoords || undefined}
                  onRouteCalculated={handleRouteCalculated}
                  className="h-[200px] border border-gray-200 rounded-lg overflow-hidden"
                />

                {/* Route info */}
                {formData.distanceKm > 0 && (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs">
                    <span className="text-green-700">
                      <strong>{formData.distanceKm} km</strong>
                      {estimatedDuration && <span className="ml-1">(~{estimatedDuration} min)</span>}
                    </span>
                    <span className="text-[10px] text-gray-400">Google Maps</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="originAddress" className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Origen (Recoger) *
                    </Label>
                    <AddressAutocomplete
                      id="originAddress"
                      value={formData.originAddress}
                      onChange={(value, coords) => {
                        setFormData(prev => ({...prev, originAddress: value}))
                        if (coords) {
                          setOriginCoords(coords)
                        }
                      }}
                      placeholder="Escribe para buscar dirección..."
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="destinationAddress" className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      Destino (Llevar) *
                    </Label>
                    <AddressAutocomplete
                      id="destinationAddress"
                      value={formData.destinationAddress}
                      onChange={(value, coords) => {
                        setFormData(prev => ({...prev, destinationAddress: value}))
                        if (coords) {
                          setDestinationCoords(coords)
                        }
                      }}
                      placeholder="Escribe para buscar dirección..."
                      required
                    />
                  </div>
                </div>
              </div>
            </GoogleMapsProvider>

            {/* Availability Status */}
            {formData.staffId && formData.scheduledAt && (
              <div className="p-3 rounded border border-gray-100">
                <div className="flex items-center space-x-2">
                  {isCheckingAvailability ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span className="text-xs text-gray-600">Verificando disponibilidad...</span>
                    </>
                  ) : availabilityStatus ? (
                    availabilityStatus.available ? (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-700 font-medium">Horario disponible</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-red-700 font-medium">Conductor ocupado en ese horario</span>
                      </>
                    )
                  ) : null}
                </div>
              </div>
            )}


            {/* Sistema de Cotización */}
            <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-700">Configuración de Tarifa</h3>
                {(formData.originAddress || formData.destinationAddress) && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    Auto-detectado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="zoneSlug">Zona</Label>
                  <Select value={formData.zoneSlug} onValueChange={(value) => setFormData({...formData, zoneSlug: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona" />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingZones.map(zone => (
                        <SelectItem key={zone.slug} value={zone.slug}>{zone.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tripType">Tipo de Viaje</Label>
                  <Select value={formData.tripType} onValueChange={(value) => setFormData({...formData, tripType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SENCILLO">Sencillo (Solo ida)</SelectItem>
                      <SelectItem value="DOBLE">Doble (Ida y vuelta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.zoneSlug !== 'medellin' && formData.zoneSlug !== 'fuera-ciudad' && (
                  <div className="col-span-2">
                    <Label htmlFor="originType">Tipo de Origen</Label>
                    <Select value={formData.originType} onValueChange={(value) => setFormData({...formData, originType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DESDE_MEDELLIN">Desde Medellín</SelectItem>
                        <SelectItem value="MISMO_MUNICIPIO">Mismo Municipio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {formData.zoneSlug === 'medellin' && (
                <div>
                  <Label htmlFor="distanceKm">Distancia (KM)</Label>
                  <Input
                    id="distanceKm"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.distanceKm}
                    onChange={(e) => setFormData({...formData, distanceKm: parseFloat(e.target.value) || 0})}
                    placeholder="Ej: 5.2"
                  />
                </div>
              )}

              {formData.zoneSlug === 'fuera-ciudad' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="outOfCityDestination">Destino Fuera de Ciudad</Label>
                    <Select value={formData.outOfCityDestination} onValueChange={(value) => setFormData({...formData, outOfCityDestination: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {outOfCityDestinations.map(dest => (
                          <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="extraKm">Kilómetros Adicionales</Label>
                    <Input
                      id="extraKm"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.extraKm}
                      onChange={(e) => setFormData({...formData, extraKm: parseFloat(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Servicios Adicionales / Extras - Agregar uno por uno */}
            {additionalServicesList.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value=""
                    onValueChange={(code) => {
                      if (code && !formData.additionalServices.some((s: any) => s.code === code)) {
                        setFormData({
                          ...formData,
                          additionalServices: [
                            ...formData.additionalServices,
                            { code, quantity: 1 }
                          ]
                        })
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="+ Agregar extra..." />
                    </SelectTrigger>
                    <SelectContent>
                      {additionalServicesList
                        .filter((s: any) => !formData.additionalServices.some((sel: any) => sel.code === s.code))
                        .map((service: any) => (
                          <SelectItem key={service.code} value={service.code}>
                            <div className="flex justify-between items-center gap-4 w-full">
                              <span>{service.name}</span>
                              <span className="text-gray-400 text-xs">${service.price?.toLocaleString()}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de extras agregados */}
                {formData.additionalServices.length > 0 && (
                  <div className="space-y-1.5">
                    {formData.additionalServices.map((selected: any) => {
                      const service = additionalServicesList.find((s: any) => s.code === selected.code)
                      if (!service) return null

                      return (
                        <div key={selected.code} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{service.name}</p>
                            <p className="text-[10px] text-gray-500">
                              ${service.price?.toLocaleString()}
                              {service.priceType === 'POR_HORA' && ' / hora'}
                              {service.priceType === 'POR_UNIDAD' && ' / unidad'}
                            </p>
                          </div>
                          {service.priceType !== 'FIJO' && (
                            <Input
                              type="number"
                              min="1"
                              value={selected.quantity || 1}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 1
                                setFormData({
                                  ...formData,
                                  additionalServices: formData.additionalServices.map((s: any) =>
                                    s.code === selected.code ? { ...s, quantity: qty } : s
                                  )
                                })
                              }}
                              className="w-14 h-7 text-xs"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                additionalServices: formData.additionalServices.filter(
                                  (s: any) => s.code !== selected.code
                                )
                              })
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <span className="text-xs">✕</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quote Breakdown */}
            {showQuoteBreakdown && currentQuote && (
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Desglose</h3>
                <div className="space-y-1">
                  {Array.isArray(currentQuote?.breakdown) ? currentQuote.breakdown.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">
                        {item?.item || 'Item'}
                        {item?.quantity && ` (x${item.quantity})`}
                      </span>
                      <span className="font-medium text-gray-900">${(item?.subtotal || 0).toLocaleString()}</span>
                    </div>
                  )) : (
                    <div className="text-xs text-gray-500">No disponible</div>
                  )}
                  <div className="border-t border-gray-200 pt-1.5 mt-1.5 flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-700">Total</span>
                    <span className="text-sm font-semibold text-gray-900">${(currentQuote?.totalPrice || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="scheduledAt">Fecha y Hora</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Información adicional sobre la cita..."
                rows={3}
              />
            </div>

            {/* Precio Estimado */}
            {formData.estimatedAmount > 0 && (
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-700">Tarifa Estimada</p>
                    <p className="text-xs text-green-600">
                      {formData.zoneSlug && formData.tripType && formData.equipmentType ?
                        'Basada en configuracion' :
                        'Configure parametros'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-semibold text-green-700">
                      ${formData.estimatedAmount.toLocaleString()}
                    </span>
                    <p className="text-xs text-green-600">COP</p>
                  </div>
                </div>
              </div>
            )}

            {/* Indicador cuando se está calculando o error de tarifa */}
            {formData.zoneSlug && formData.staffId && formData.estimatedAmount === 0 && (
              <div className={`p-3 rounded border ${rateNotFoundError ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                {rateNotFoundError ? (
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 text-sm">⚠️</span>
                    <div>
                      <p className="text-xs font-medium text-red-700">Tarifa no definida</p>
                      <p className="text-xs text-red-600 mt-0.5">{rateNotFoundError}</p>
                      <p className="text-xs text-red-500 mt-1">Debe agregar esta tarifa en Configuración → Tarifas</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-xs text-gray-500">Calculando tarifa...</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                {isEditMode ? 'Guardar Cambios' : 'Crear Cita'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles de cita */}
      <Dialog open={showDetailsModal} onOpenChange={(open) => {
        setShowDetailsModal(open)
        if (!open) setIsEditMode(false)
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">
              {isEditMode ? 'Editar Cita' : 'Detalles de Cita'}
            </DialogTitle>
            <DialogDescription className="text-xs flex items-center gap-2">
              {selectedEvent && moment(selectedEvent.start).format('ddd D MMM, HH:mm')}
              {selectedEvent && !isEditMode && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
                  {getStatusLabel(selectedEvent.status)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && !isEditMode && (
            <div className="space-y-4">
              {/* Info principal */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{selectedEvent.customerName}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">${selectedEvent.totalAmount.toLocaleString()}</span>
              </div>

              {/* Ruta */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center py-1">
                  <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                  <div className="w-px h-full bg-gray-300 my-1 min-h-[20px]"></div>
                  <div className="w-2 h-2 rounded-full border-2 border-gray-900"></div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Origen</p>
                    <p className="text-sm text-gray-900">{selectedEvent.originAddress || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase">Destino</p>
                    <p className="text-sm text-gray-900">{selectedEvent.destinationAddress || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Conductor</p>
                  <p className="text-sm text-gray-900">{selectedEvent.staffName || 'Sin asignar'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1">Equipo</p>
                  <p className="text-sm text-gray-900">
                    {selectedEvent.equipmentType === 'ROBOTICA_PLEGABLE' ? 'Robótica' : 'Rampa'}
                  </p>
                </div>
              </div>

              {/* Cambiar estado */}
              {selectedEvent.status !== 'COMPLETED' && selectedEvent.status !== 'CANCELLED' && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-2">Cambiar Estado</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.status !== 'CONFIRMED' && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatusChange('CONFIRMED')}>
                        Confirmar
                      </Button>
                    )}
                    {selectedEvent.status === 'CONFIRMED' && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatusChange('IN_PROGRESS')}>
                        Iniciar
                      </Button>
                    )}
                    {selectedEvent.status === 'IN_PROGRESS' && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => handleStatusChange('COMPLETED')}>
                        Completar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs text-gray-500" onClick={handleCancelAppointment}>
                      Cancelar Cita
                    </Button>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col gap-2 pt-2">
                {/* Fila de acciones */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReceipt(selectedEvent.appointmentId)}
                    disabled={isDownloadingReceipt}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    {isDownloadingReceipt ? 'Descargando...' : 'Recibo PDF'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyServiceOrder}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copiar Orden
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendWhatsApp}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                    WhatsApp
                  </Button>
                </div>
                {/* Fila de navegación */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button variant="ghost" size="sm" onClick={() => { setShowDetailsModal(false); setSelectedAppointmentDetails(null) }}>
                    Cerrar
                  </Button>
                  <Button size="sm" onClick={handleOpenEdit}>
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* Modal de descarga de recibo post-creacion */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-green-600" />
              </div>
              Cita Creada Exitosamente
            </DialogTitle>
            <DialogDescription className="text-xs">
              La cita ha sido programada. Puedes descargar el recibo ahora o hacerlo despues desde los detalles de la cita.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={async () => {
                if (createdAppointmentId) {
                  await handleDownloadReceipt(createdAppointmentId)
                }
                setShowReceiptModal(false)
                setCreatedAppointmentId(null)
              }}
              disabled={isDownloadingReceipt}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloadingReceipt ? 'Generando recibo...' : 'Descargar Recibo PDF'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowReceiptModal(false)
                setCreatedAppointmentId(null)
              }}
              className="text-gray-500"
            >
              Descargar mas tarde
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}