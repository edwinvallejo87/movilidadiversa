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

// Configurar moment en español
moment.locale('es')
const localizer = momentLocalizer(moment)

interface AppointmentEvent extends Event {
  id: string
  appointmentId: string
  serviceId: string
  customerId: string
  staffId?: string
  resourceId?: string
  status: string
  serviceName: string
  serviceColor: string
  customerName: string
  staffName?: string
  resourceName?: string
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
  
  // Form data
  const [customers, setCustomers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    customerId: '',
    serviceId: '',
    staffId: '',
    resourceId: '',
    scheduledAt: '',
    notes: '',
    estimatedAmount: 0,
    
    // New quote system fields
    zoneSlug: 'medellin',
    tripType: 'SENCILLO',
    equipmentType: 'RAMPA',
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

  useEffect(() => {
    loadAppointments()
    loadFormData()
  }, [])

  const loadFormData = async () => {
    try {
      const [customersRes, servicesRes, staffRes, resourcesRes, pricingZonesRes, additionalServicesRes, destinationsRes] = await Promise.all([
        fetch('/api/admin/clients'),
        fetch('/api/admin/services'),
        fetch('/api/admin/staff'),
        fetch('/api/admin/resources'),
        fetch('/api/quotes/calculate?type=zones'),
        fetch('/api/quotes/calculate?type=additional-services'),
        fetch('/api/quotes/calculate?type=out-of-city-destinations')
      ])
      
      if (customersRes.ok) {
        const customersData = await customersRes.json()
        setCustomers(customersData.customers || [])
      }
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(Array.isArray(servicesData) ? servicesData : [])
      }
      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStaff(Array.isArray(staffData) ? staffData : [])
      }
      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json()
        setResources(Array.isArray(resourcesData) ? resourcesData : [])
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
      
      const appointmentEvents: AppointmentEvent[] = Array.isArray(data?.appointments) ? data.appointments.map((apt: any) => {
        // Crear título más informativo que muestre la agrupación
        let title = `${apt.service.name} - ${apt.customer.name}`
        if (apt.staff?.name) {
          title += ` (${apt.staff.name})`
        }
        
        return {
          id: apt.id,
          appointmentId: apt.id,
          title,
          start: new Date(apt.scheduledAt),
          end: new Date(new Date(apt.scheduledAt).getTime() + (apt.estimatedDuration || apt.service.durationMinutes || 60) * 60000),
          serviceId: apt.serviceId,
          customerId: apt.customerId,
          staffId: apt.staffId,
          resourceId: apt.resourceId,
          status: apt.status,
          serviceName: apt.service.name,
          serviceColor: apt.service.color || '#3B82F6',
          customerName: apt.customer.name,
          staffName: apt.staff?.name || 'Sin asignar',
          resourceName: apt.resource?.name,
          totalAmount: apt.totalAmount,
          originAddress: apt.originAddress || '',
          destinationAddress: apt.destinationAddress || ''
        }
      }) : []
      
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
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: '600',
        color: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
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
      serviceId: '',
      staffId: '',
      resourceId: '',
      scheduledAt: '',
      notes: '',
      estimatedAmount: 0,
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
  }

  const checkAvailability = async () => {
    if (!formData.scheduledAt || !formData.serviceId) return

    const selectedService = services.find(s => s.id === formData.serviceId)
    if (!selectedService) return

    const startDateTime = new Date(formData.scheduledAt)
    const endDateTime = new Date(startDateTime.getTime() + (selectedService.durationMinutes * 60000))

    if (!formData.staffId && !formData.resourceId) {
      setAvailabilityStatus(null)
      return
    }

    setIsCheckingAvailability(true)
    try {
      const params = new URLSearchParams({
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString()
      })

      if (formData.staffId && formData.staffId !== 'none') params.append('staffId', formData.staffId)
      if (formData.resourceId && formData.resourceId !== 'none') params.append('resourceId', formData.resourceId)

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
    if (formData.staffId || formData.resourceId) {
      const timeoutId = setTimeout(checkAvailability, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setAvailabilityStatus(null)
    }
  }, [formData.staffId, formData.resourceId, formData.scheduledAt, formData.serviceId])

  const calculateQuote = async () => {
    // Check if we have the minimum required data
    if (!formData.zoneSlug || !formData.tripType || !formData.equipmentType) {
      setCurrentQuote(null)
      setFormData(prev => ({...prev, estimatedAmount: 0}))
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
        const error = await response.json()
        console.error('Error calculando cotización:', error)
        setCurrentQuote(null)
        setFormData(prev => ({...prev, estimatedAmount: 0}))
        setShowQuoteBreakdown(false)
      }
    } catch (error) {
      console.error('Error calculando cotización:', error)
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
    
    if (!formData.customerId || !formData.serviceId || !formData.scheduledAt) {
      toast.error('Por favor complete todos los campos obligatorios')
      return
    }

    // Check availability first if staff or resource is assigned
    if (availabilityStatus && !availabilityStatus.available) {
      toast.error('El staff o recurso seleccionado no está disponible en ese horario')
      return
    }

    try {
      // Use the simplified admin API
      const appointmentPayload = {
        customerId: formData.customerId,
        serviceId: formData.serviceId,
        staffId: formData.staffId || undefined,
        resourceId: formData.resourceId || undefined,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        originAddress: formData.zoneSlug === 'medellin' ? 'Medellín' : formData.zoneSlug || 'Ubicación origen',
        destinationAddress: formData.outOfCityDestination || 'Ubicación destino',
        notes: formData.notes
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Calendario de Citas</h1>
        <p className="page-subtitle">Gestiona todas las citas y horarios de tu equipo</p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-start space-x-3">
          <div className="bg-gray-900 rounded-lg p-2">
            <span className="text-white text-lg">📅</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Centro de Gestión de Citas</h3>
            <p className="text-gray-600 text-sm mb-3">
              Haz clic en cualquier horario para crear una nueva cita. Cada cita agrupa:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                👤 Cliente
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                🔧 Servicio
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                👨‍💼 Personal
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
                🚗 Recursos
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Toolbar personalizado */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              onClick={() => setView('day')}
            >
              Día
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              onClick={() => setView('week')}
            >
              Semana
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              onClick={() => setView('month')}
            >
              Mes
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                const newDate = moment(date).subtract(1, view === 'day' ? 'day' : view === 'week' ? 'week' : 'month').toDate()
                setDate(newDate)
              }}
            >
              ←
            </Button>
            <Button
              variant="outline"
              onClick={() => setDate(new Date())}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const newDate = moment(date).add(1, view === 'day' ? 'day' : view === 'week' ? 'week' : 'month').toDate()
                setDate(newDate)
              }}
            >
              →
            </Button>
          </div>
        </div>

        {/* Leyenda de estados */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            <span className="text-sm font-medium text-blue-700">Programado</span>
          </div>
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">Confirmado</span>
          </div>
          <div className="flex items-center space-x-2 bg-orange-50 px-3 py-2 rounded-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
            <span className="text-sm font-medium text-orange-700">En Progreso</span>
          </div>
          <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
            <span className="text-sm font-medium text-purple-700">Completado</span>
          </div>
          <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
            <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
            <span className="text-sm font-medium text-red-700">Cancelado</span>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '700px' }}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📅 Crear Nuevo Booking</DialogTitle>
            <DialogDescription>
              Agrupa Cliente + Servicio + Staff + Recursos en una cita
            </DialogDescription>
            {selectedSlot && (
              <div className="text-blue-600 font-medium text-sm mb-4">
                📅 {moment(selectedSlot.start).format('LLLL')}
              </div>
            )}
          </DialogHeader>
          
          <form onSubmit={handleCreateAppointment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="serviceId">Servicio *</Label>
                <Select value={formData.serviceId} onValueChange={(value) => setFormData({...formData, serviceId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services && services.length > 0 ? services.filter(s => s.isActive).map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: service.color }}
                          />
                          <span>{service.name}</span>
                        </div>
                      </SelectItem>
                    )) : (
                      <div className="text-gray-500 px-2 py-1 text-sm">No hay servicios disponibles</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="staffId">Asignar Personal</Label>
                <Select value={formData.staffId || 'none'} onValueChange={(value) => setFormData({...formData, staffId: value === 'none' ? '' : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar personal (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin personal asignado</SelectItem>
                    {staff && staff.length > 0 ? staff.filter(s => s.isActive && s.status === 'AVAILABLE').map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{member.name}</span>
                          <Badge variant="outline" className="ml-2">{member.type}</Badge>
                        </div>
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resourceId">Asignar Recurso</Label>
                <Select value={formData.resourceId || 'none'} onValueChange={(value) => setFormData({...formData, resourceId: value === 'none' ? '' : value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar recurso (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin recurso asignado</SelectItem>
                    {resources && resources.length > 0 ? resources.filter(r => r.isActive).map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: resource.color }}
                          />
                          <span>{resource.name} ({resource.type})</span>
                        </div>
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Availability Status */}
            {(formData.staffId || formData.resourceId) && formData.scheduledAt && (
              <div className="p-4 rounded-lg border">
                <div className="flex items-center space-x-2">
                  {isCheckingAvailability ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Verificando disponibilidad...</span>
                    </>
                  ) : availabilityStatus ? (
                    availabilityStatus.available ? (
                      <>
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700 font-medium">✓ Horario disponible</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <div className="text-sm text-red-700">
                          <p className="font-medium">⚠️ Conflicto de horario</p>
                          {!availabilityStatus.staff.available && (
                            <p className="text-xs">Personal ocupado</p>
                          )}
                          {!availabilityStatus.resource.available && (
                            <p className="text-xs">Recurso ocupado</p>
                          )}
                        </div>
                      </>
                    )
                  ) : null}
                </div>
              </div>
            )}


            {/* Sistema de Cotización */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">🧮</span>
                <h3 className="font-medium text-blue-900">Configuración de Tarifa</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <Label htmlFor="equipmentType">Tipo de Equipo</Label>
                  <Select value={formData.equipmentType} onValueChange={(value) => setFormData({...formData, equipmentType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RAMPA">Vehículo con Rampa</SelectItem>
                      <SelectItem value="ROBOTICA_PLEGABLE">Silla Robótica/Plegable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.zoneSlug !== 'medellin' && formData.zoneSlug !== 'fuera-ciudad' && (
                  <div>
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

            {/* Quote Breakdown */}
            {showQuoteBreakdown && currentQuote && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">📋</span>
                  <h3 className="font-medium text-gray-900">Desglose de Precio</h3>
                </div>
                
                <div className="space-y-2">
                  {Array.isArray(currentQuote?.breakdown) ? currentQuote.breakdown.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">
                        {item?.item || 'Item desconocido'}
                        {item?.quantity && ` (x${item.quantity})`}
                      </span>
                      <span className="font-medium">${(item?.subtotal || 0).toLocaleString()}</span>
                    </div>
                  )) : (
                    <div className="text-sm text-gray-500">No hay desglose disponible</div>
                  )}
                  <div className="border-t pt-2 flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span className="text-green-600">${(currentQuote?.totalPrice || 0).toLocaleString()}</span>
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

            {/* Precio Estimado estilo Uber */}
            {formData.estimatedAmount > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 text-lg">💰</span>
                    <div>
                      <p className="font-semibold text-green-800">Tarifa Estimada</p>
                      <p className="text-xs text-green-600">
                        {formData.zoneSlug && formData.tripType && formData.equipmentType ? 
                          'Basada en zona y configuración' : 
                          'Configura los parámetros de cotización'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-700">
                      ${formData.estimatedAmount.toLocaleString()}
                    </span>
                    <p className="text-xs text-green-600">COP</p>
                  </div>
                </div>
              </div>
            )}

            {/* Indicador cuando se está calculando */}
            {formData.zoneSlug && formData.serviceId && formData.estimatedAmount === 0 && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="animate-pulse w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">Calculando tarifa...</span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Crear Cita
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles de cita */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de la cita programada
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-6">
              {/* Header con información principal */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="font-semibold text-blue-900 mb-2">📅 Booking Agrupado</h3>
                <p className="text-blue-700 text-sm">Cliente + Servicio + Staff + Recursos</p>
              </div>

              {/* Información del Booking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cliente */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-sm font-bold">👤</span>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">CLIENTE</Label>
                      <p className="text-lg font-semibold">{selectedEvent.customerName}</p>
                    </div>
                  </div>
                </div>

                {/* Servicio */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: selectedEvent.serviceColor }}
                    >
                      <span className="text-white text-sm font-bold">🔧</span>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">SERVICIO</Label>
                      <p className="text-lg font-semibold">{selectedEvent.serviceName}</p>
                      <p className="text-sm text-gray-600">{services.find(s => s.id === selectedEvent.serviceId)?.durationMinutes || 60} min</p>
                    </div>
                  </div>
                </div>

                {/* Staff */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">👨‍💼</span>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">PERSONAL</Label>
                      <p className="text-lg font-semibold">{selectedEvent.staffName || 'Sin asignar'}</p>
                      {!selectedEvent.staffName && (
                        <p className="text-xs text-amber-600">⚠️ Pendiente asignación</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recurso */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm font-bold">🚗</span>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500">RECURSO</Label>
                      <p className="text-lg font-semibold">{selectedEvent.resourceName || 'Sin asignar'}</p>
                      {!selectedEvent.resourceName && (
                        <p className="text-xs text-amber-600">⚠️ Sin recurso específico</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Estado y detalles */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Estado</Label>
                  <Badge className={
                    selectedEvent.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                    selectedEvent.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    selectedEvent.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedEvent.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID de Cita</Label>
                  <p className="text-xs text-gray-500 font-mono">{selectedEvent.appointmentId}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Origen</Label>
                <p>{selectedEvent.originAddress}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Destino</Label>
                <p>{selectedEvent.destinationAddress}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Programado</Label>
                  <p>{moment(selectedEvent.start).format('LLLL')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Monto Total</Label>
                  <p className="text-xl font-bold text-green-600">
                    ${selectedEvent.totalAmount.toLocaleString()} COP
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                  Cerrar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Editar Cita
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}