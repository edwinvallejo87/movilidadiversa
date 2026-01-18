'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Accessibility,
  Car,
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

type Step = 'service' | 'route' | 'datetime' | 'contact' | 'confirm'

interface PriceCalculation {
  zone: string
  zoneSlug: string
  isOutOfCity: boolean
  equipmentType: string
  tripType: string
  breakdown: { item: string, amount: number }[]
  surcharges: { item: string, amount: number }[]
  basePrice: number
  surchargeTotal: number
  total: number
}

export default function BookingPage() {
  const [step, setStep] = useState<Step>('service')
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)

  const [formData, setFormData] = useState({
    // Service
    equipmentType: '' as 'RAMPA' | 'ROBOTICA_PLEGABLE' | '',
    tripType: '' as 'SENCILLO' | 'DOBLE' | '',

    // Route
    originAddress: '',
    destinationAddress: '',

    // DateTime
    date: '',
    time: '',

    // Contact
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: ''
  })

  const [priceCalc, setPriceCalc] = useState<PriceCalculation | null>(null)

  // Calculate price when relevant fields change
  useEffect(() => {
    if (formData.equipmentType && formData.tripType && formData.originAddress && formData.destinationAddress) {
      calculatePrice()
    }
  }, [formData.equipmentType, formData.tripType, formData.originAddress, formData.destinationAddress, formData.date, formData.time])

  const calculatePrice = async () => {
    setCalculating(true)
    try {
      const scheduledAt = formData.date && formData.time
        ? new Date(`${formData.date}T${formData.time}`).toISOString()
        : null

      const response = await fetch('/api/booking/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originAddress: formData.originAddress,
          destinationAddress: formData.destinationAddress,
          equipmentType: formData.equipmentType,
          tripType: formData.tripType,
          scheduledAt
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPriceCalc(data)
      }
    } catch (err) {
      console.error('Error calculating price:', err)
    } finally {
      setCalculating(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString()

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || null,
          originAddress: formData.originAddress,
          destinationAddress: formData.destinationAddress,
          scheduledAt,
          equipmentType: formData.equipmentType,
          tripType: formData.tripType,
          estimatedAmount: priceCalc?.total || 0,
          zone: priceCalc?.zone,
          notes: formData.notes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.details
          ? `${data.error}: ${data.details.join(', ')}`
          : data.error || 'Error al crear la reserva'
        throw new Error(errorMsg)
      }

      setBookingResult(data)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la reserva')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const canProceed = () => {
    switch (step) {
      case 'service':
        return formData.equipmentType && formData.tripType
      case 'route':
        return formData.originAddress.length >= 5 && formData.destinationAddress.length >= 5
      case 'datetime':
        return formData.date && formData.time
      case 'contact':
        return formData.customerName.length >= 2 && formData.customerPhone.length >= 7
      default:
        return true
    }
  }

  const nextStep = () => {
    const steps: Step[] = ['service', 'route', 'datetime', 'contact', 'confirm']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: Step[] = ['service', 'route', 'datetime', 'contact', 'confirm']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-lg mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Accessibility className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Movilidad Diversa</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-lg mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Reserva Confirmada</h1>
            <p className="text-sm text-gray-500 mb-8">
              Tu servicio ha sido programado exitosamente
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium text-gray-900">
                    {new Date(`${formData.date}T${formData.time}`).toLocaleDateString('es-CO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hora</span>
                  <span className="font-medium text-gray-900">{formData.time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Conductor</span>
                  <span className="font-medium text-gray-900">{bookingResult?.appointment?.staff || 'Por asignar'}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                  <span className="text-gray-500">Total a pagar</span>
                  <span className="font-semibold text-gray-900">{formatPrice(priceCalc?.total || 0)}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              Recibirás una confirmación por WhatsApp. El pago se realiza al finalizar el servicio.
            </p>

            <div className="flex flex-col gap-3">
              <Link href="/">
                <Button className="w-full">Volver al inicio</Button>
              </Link>
              <a href={`https://wa.me/573001234567?text=Hola, acabo de reservar un servicio para el ${formData.date} a las ${formData.time}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  Contactar por WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Accessibility className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Movilidad Diversa</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {['service', 'route', 'datetime', 'contact', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step === s ? 'bg-gray-900 text-white' :
                ['service', 'route', 'datetime', 'contact', 'confirm'].indexOf(step) > i ? 'bg-gray-900 text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i + 1}
              </div>
              {i < 4 && <div className={`w-8 h-0.5 ${['service', 'route', 'datetime', 'contact', 'confirm'].indexOf(step) > i ? 'bg-gray-900' : 'bg-gray-100'}`} />}
            </div>
          ))}
        </div>

        {/* Step: Service */}
        {step === 'service' && (
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Tipo de servicio</h1>
            <p className="text-xs text-gray-500 mb-6">Selecciona el equipo y tipo de viaje</p>

            <div className="space-y-4 mb-6">
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Tipo de equipo</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, equipmentType: 'RAMPA' })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.equipmentType === 'RAMPA'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Car className={`w-5 h-5 mb-2 ${formData.equipmentType === 'RAMPA' ? 'text-gray-900' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-900">Rampa</p>
                    <p className="text-[10px] text-gray-500">Vehículo adaptado</p>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, equipmentType: 'ROBOTICA_PLEGABLE' })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.equipmentType === 'ROBOTICA_PLEGABLE'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Accessibility className={`w-5 h-5 mb-2 ${formData.equipmentType === 'ROBOTICA_PLEGABLE' ? 'text-gray-900' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-900">Silla Robótica</p>
                    <p className="text-[10px] text-gray-500">Para escaleras</p>
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500 mb-2 block">Tipo de viaje</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, tripType: 'SENCILLO' })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.tripType === 'SENCILLO'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">Solo ida</p>
                    <p className="text-[10px] text-gray-500">Un solo trayecto</p>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, tripType: 'DOBLE' })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.tripType === 'DOBLE'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">Ida y vuelta</p>
                    <p className="text-[10px] text-gray-500">Incluye regreso</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Route */}
        {step === 'route' && (
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Ruta</h1>
            <p className="text-xs text-gray-500 mb-6">Ingresa las direcciones de origen y destino</p>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="origin" className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Dirección de origen
                </Label>
                <Input
                  id="origin"
                  value={formData.originAddress}
                  onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                  placeholder="Ej: Calle 50 #45-30, El Poblado, Medellín"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="destination" className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Dirección de destino
                </Label>
                <Input
                  id="destination"
                  value={formData.destinationAddress}
                  onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                  placeholder="Ej: Carrera 70 #10-25, Laureles, Medellín"
                  className="text-sm"
                />
              </div>
            </div>

            {priceCalc && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-[10px] text-gray-500 mb-1">Zona detectada</p>
                <p className="text-sm font-medium text-gray-900">{priceCalc.zone}</p>
              </div>
            )}
          </div>
        )}

        {/* Step: DateTime */}
        {step === 'datetime' && (
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Fecha y hora</h1>
            <p className="text-xs text-gray-500 mb-6">Selecciona cuándo necesitas el servicio</p>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="date" className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Fecha
                </Label>
                <Input
                  id="date"
                  type="date"
                  min={getMinDate()}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="time" className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Hora
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>

            {priceCalc && priceCalc.surcharges.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-800">
                  {priceCalc.surcharges.map(s => s.item).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step: Contact */}
        {step === 'contact' && (
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Tus datos</h1>
            <p className="text-xs text-gray-500 mb-6">Información de contacto para la reserva</p>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="name" className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Nombre completo
                </Label>
                <Input
                  id="name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Tu nombre"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Teléfono
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="300 123 4567"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email (opcional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="tu@email.com"
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-xs text-gray-500 mb-1.5">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Información adicional sobre tus necesidades..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Confirmar reserva</h1>
            <p className="text-xs text-gray-500 mb-6">Revisa los detalles de tu servicio</p>

            <div className="space-y-4 mb-6">
              {/* Route Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center py-1">
                    <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                    <div className="w-px h-full bg-gray-300 my-1 min-h-[20px]"></div>
                    <div className="w-2 h-2 rounded-full border-2 border-gray-900"></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Origen</p>
                      <p className="text-xs text-gray-900">{formData.originAddress}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase">Destino</p>
                      <p className="text-xs text-gray-900">{formData.destinationAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                <div className="flex justify-between p-3">
                  <span className="text-xs text-gray-500">Fecha</span>
                  <span className="text-xs font-medium text-gray-900">
                    {formData.date && new Date(formData.date + 'T00:00:00').toLocaleDateString('es-CO', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-xs text-gray-500">Hora</span>
                  <span className="text-xs font-medium text-gray-900">{formData.time}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-xs text-gray-500">Servicio</span>
                  <span className="text-xs font-medium text-gray-900">
                    {formData.equipmentType === 'ROBOTICA_PLEGABLE' ? 'Silla Robótica' : 'Rampa'}
                  </span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-xs text-gray-500">Tipo</span>
                  <span className="text-xs font-medium text-gray-900">
                    {formData.tripType === 'DOBLE' ? 'Ida y vuelta' : 'Solo ida'}
                  </span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-xs text-gray-500">Cliente</span>
                  <span className="text-xs font-medium text-gray-900">{formData.customerName}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-xs text-gray-500">Teléfono</span>
                  <span className="text-xs font-medium text-gray-900">{formData.customerPhone}</span>
                </div>
              </div>

              {/* Price */}
              {priceCalc && (
                <div className="bg-gray-900 text-white rounded-lg p-4">
                  <div className="space-y-2 mb-3">
                    {priceCalc.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-400">{item.item}</span>
                        <span>{formatPrice(item.amount)}</span>
                      </div>
                    ))}
                    {priceCalc.surcharges.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-400">{item.item}</span>
                        <span>{formatPrice(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between">
                    <span className="text-sm font-medium">Total a pagar</span>
                    <span className="text-lg font-semibold">{formatPrice(priceCalc.total)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price Preview (shown on all steps except confirm) */}
        {step !== 'confirm' && priceCalc && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Precio estimado</span>
              <span className="text-sm font-semibold text-gray-900">
                {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : formatPrice(priceCalc.total)}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {step !== 'service' && (
            <Button variant="outline" onClick={prevStep} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
          )}
          {step !== 'confirm' ? (
            <Button onClick={nextStep} disabled={!canProceed()} className="flex-1">
              Continuar
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Reserva'
              )}
            </Button>
          )}
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 mb-2">¿Necesitas ayuda?</p>
          <a
            href="https://wa.me/573001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Contáctanos por WhatsApp
          </a>
        </div>
      </main>
    </div>
  )
}
