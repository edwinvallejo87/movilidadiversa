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
import { Calendar as CalendarIcon, User, Wrench, Car, AlertTriangle, ClipboardList, DollarSign, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/admin'

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
  
  // Availability checking
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<any>(null)

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
    // If origin is Medellín and destination is different metro zone
    if (originZone === 'medellin' && destZone && destZone !== 'medellin' && destZone !== 'fuera-ciudad') {
      return 'DESDE_MEDELLIN'
    }
    // If destination is Medellín and origin is different metro zone
    if (destZone === 'medellin' && originZone && originZone !== 'medellin' && originZone !== 'fuera-ciudad') {
      return 'DESDE_MEDELLIN'
    }
    // Same municipality
    return 'MISMO_MUNICIPIO'
  }

  // Detect out-of-city destination name from address
  const detectOutOfCityDestination = (address: string): string => {
    if (!address) return ''
    const addr = address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    if (addr.includes('aeropuerto') || addr.includes('jmc') || addr.includes('jose maria')) {
      return 'Aeropuerto JMC'
    }
    if (addr.includes('rionegro')) return 'Rionegro'
    if (addr.includes('la ceja')) return 'La Ceja'
    if (addr.includes('marinilla')) return 'Marinilla'
    if (addr.includes('el retiro')) return 'El Retiro'
    if (addr.includes('abejorral')) return 'Abejorral'

    return ''
  }

  // Auto-detect zone when addresses change
  useEffect(() => {
    const originZone = detectZoneFromAddress(formData.originAddress)
    const destZone = detectZoneFromAddress(formData.destinationAddress)

    // Determine the primary zone (destination takes priority for out-of-city)
    let detectedZone = destZone || originZone

    // If either is out-of-city, use that
    if (originZone === 'fuera-ciudad' || destZone === 'fuera-ciudad') {
      detectedZone = 'fuera-ciudad'
    }

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
    // Map status to CSS classes for elegant styling
    const statusClassMap = {
      'SCHEDULED': 'event-scheduled',
      'CONFIRMED': 'event-confirmed',
      'IN_PROGRESS': 'event-in-progress',
      'COMPLETED': 'event-completed',
      'CANCELLED': 'event-cancelled'
    }

    const statusClass = statusClassMap[event.status as keyof typeof statusClassMap] || 'event-scheduled'

    return {
      className: statusClass,
      style: {
        border: 'none',
        borderRadius: '3px',
        padding: '2px 6px',
        fontSize: '11px',
        fontWeight: '500',
        color: 'white'
      }
    }
  }

  const handleSelectEvent = (event: AppointmentEvent) => {
    setSelectedEvent(event)
    setShowDetailsModal(true)
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
      return
    }

    // For out-of-city zone, destination is required
    if (formData.zoneSlug === 'fuera-ciudad' && !formData.outOfCityDestination) {
      setCurrentQuote(null)
      setFormData(prev => ({...prev, estimatedAmount: 0}))
      setShowQuoteBreakdown(false)
      return
    }

    // Auto-detect night schedule and holidays
    const isNightSchedule = formData.scheduledAt ? (() => {
      const date = new Date(formData.scheduledAt)
      const hour = date.getHours()
      return hour >= 18 || hour < 6
    })() : formData.isNightSchedule

    const isHolidayOrSunday = formData.scheduledAt ? (() => {
      const date = new Date(formData.scheduledAt)
      return date.getDay() === 0 // Sunday
    })() : formData.isHolidayOrSunday

    try {
      const quoteRequest: any = {
        zoneSlug: formData.zoneSlug,
        tripType: formData.tripType,
        equipmentType: formData.equipmentType,
        additionalServices: formData.additionalServices,
        isNightSchedule,
        isHolidayOrSunday
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
          estimatedAmount: quote.totalPrice,
          isNightSchedule,
          isHolidayOrSunday
        }))
        setShowQuoteBreakdown(true)
      } else {
        // Rate not found for this combination - this is expected in some cases
        setCurrentQuote(null)
        setFormData(prev => ({...prev, estimatedAmount: 0}))
        setShowQuoteBreakdown(false)
      }
    } catch (error) {
      // Network or other error
      setCurrentQuote(null)
      setFormData(prev => ({...prev, estimatedAmount: 0}))
      setShowQuoteBreakdown(false)
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
        additionalServices: [],
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

  // Handle create or update appointment
  const handleSubmitAppointment = async (e: React.FormEvent) => {
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
    if (availabilityStatus && !availabilityStatus.available && !isEditMode) {
      toast.error('El conductor seleccionado no está disponible en ese horario')
      return
    }

    try {
      // Get equipment type from selected staff
      const selectedStaff = staff.find(s => s.id === formData.staffId)
      const equipmentType = selectedStaff?.equipmentType || formData.equipmentType

      const payload = {
        customerId: formData.customerId,
        staffId: formData.staffId || null,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        originAddress: formData.originAddress,
        destinationAddress: formData.destinationAddress,
        notes: formData.notes,
        estimatedAmount: formData.estimatedAmount,
        distanceKm: formData.distanceKm || 0,
        pricingBreakdown: currentQuote?.breakdown || undefined,
        equipmentType
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar')
      }

      toast.success(isEditMode ? 'Cita actualizada' : 'Cita creada')
      setShowCreateModal(false)
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
      <Dialog open={showCreateModal} onOpenChange={(open) => {
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
              <Select value={formData.customerId} onValueChange={(value) => setFormData({...formData, customerId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers && customers.length > 0 ? customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  )) : (
                    <div className="text-gray-500 px-2 py-1 text-sm">No hay clientes disponibles</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="staffId">Conductor + Vehículo *</Label>
              <Select
                value={formData.staffId || 'none'}
                onValueChange={(value) => {
                  const selectedMember = staff.find(s => s.id === value)
                  setFormData({
                    ...formData,
                    staffId: value === 'none' ? '' : value,
                    equipmentType: selectedMember?.equipmentType || 'RAMPA'
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar conductor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {staff && staff.length > 0 ? staff.filter(s => s.isActive && s.status === 'AVAILABLE').map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: member.color || '#3B82F6' }}
                        />
                        <span>{member.name}</span>
                        {member.licensePlate && (
                          <span className="text-gray-400 text-xs">({member.licensePlate})</span>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {member.equipmentType === 'ROBOTICA_PLEGABLE' ? 'Robótica' : 'Rampa'}
                        </Badge>
                      </div>
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
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

            {/* Direcciones */}
            <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-3">
              <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                Direcciones
              </h3>

              <div>
                <Label htmlFor="originAddress">Direccion de Origen (Recoger) *</Label>
                <Input
                  id="originAddress"
                  value={formData.originAddress}
                  onChange={(e) => setFormData({...formData, originAddress: e.target.value})}
                  placeholder="Ej: Calle 10 #45-23, Medellin"
                  required
                />
              </div>

              <div>
                <Label htmlFor="destinationAddress">Direccion de Destino (Llevar) *</Label>
                <Input
                  id="destinationAddress"
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({...formData, destinationAddress: e.target.value})}
                  placeholder="Ej: Carrera 70 #12-34, Envigado"
                  required
                />
              </div>
            </div>

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

            {/* Indicador cuando se está calculando */}
            {formData.zoneSlug && formData.staffId && formData.estimatedAmount === 0 && (
              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-500">Calculando tarifa...</span>
                </div>
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
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(false)}>
                  Cerrar
                </Button>
                <Button size="sm" onClick={handleOpenEdit}>
                  Editar
                </Button>
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
    </div>
  )
}