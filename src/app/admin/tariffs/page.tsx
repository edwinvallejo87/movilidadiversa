'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react'

interface Zone {
  id: string
  name: string
  isActive: boolean
}

interface Service {
  id: string
  name: string
  isActive: boolean
}

interface TariffRule {
  id: string
  zone: Zone
  service: Service
  pricingMode: string
  fixedPrice?: number
  pricePerKm?: number
  isActive: boolean
  distanceTiers: DistanceTier[]
}

interface DistanceTier {
  id: string
  minKm: number
  maxKm?: number
  price: number
}

interface Surcharge {
  id: string
  name: string
  type: string
  amount: number
  amountType: string
  isActive: boolean
  conditionJson: string | null
}

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<TariffRule[]>([])
  const [surcharges, setSurcharges] = useState<Surcharge[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSurchargeDialogOpen, setIsSurchargeDialogOpen] = useState(false)
  const [editingTariff, setEditingTariff] = useState<TariffRule | null>(null)
  const [editingSurcharge, setEditingSurcharge] = useState<Surcharge | null>(null)

  const [formData, setFormData] = useState({
    zoneId: 'general',
    serviceId: '',
    pricingMode: 'FIXED',
    fixedPrice: '',
    pricePerKm: '',
    isActive: true
  })

  const [surchargeFormData, setSurchargeFormData] = useState({
    name: '',
    type: 'TIME_BASED',
    amount: '',
    amountType: 'FIXED',
    isActive: true,
    timeRanges: [{ start: '', end: '' }],
    daysOfWeek: [] as number[],
    holidays: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [tariffsRes, surchargesRes, zonesRes, servicesRes] = await Promise.all([
        fetch('/api/admin/tariffs'),
        fetch('/api/admin/surcharges'),
        fetch('/api/admin/zones'),
        fetch('/api/admin/services')
      ])

      if (tariffsRes.ok) {
        const tariffsData = await tariffsRes.json()
        setTariffs(Array.isArray(tariffsData) ? tariffsData : [])
      }
      
      if (surchargesRes.ok) {
        const surchargesData = await surchargesRes.json()
        setSurcharges(Array.isArray(surchargesData) ? surchargesData : [])
      }
      
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json()
        setZones(Array.isArray(zonesData) ? zonesData : [])
      }
      
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(Array.isArray(servicesData?.services) ? servicesData.services : [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set empty arrays as fallbacks
      setTariffs([])
      setSurcharges([])
      setZones([])
      setServices([])
    }
  }

  const handleTariffSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        fixedPrice: formData.fixedPrice ? parseFloat(formData.fixedPrice) : null,
        pricePerKm: formData.pricePerKm ? parseFloat(formData.pricePerKm) : null
      }

      const url = editingTariff 
        ? `/api/admin/tariffs/${editingTariff.id}` 
        : '/api/admin/tariffs'
      const method = editingTariff ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setEditingTariff(null)
        setFormData({ zoneId: 'general', serviceId: '', pricingMode: 'FIXED', fixedPrice: '', pricePerKm: '', isActive: true })
        fetchData()
      }
    } catch (error) {
      console.error('Error saving tariff:', error)
    }
  }

  const handleSurchargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const conditions = {
        timeRanges: surchargeFormData.timeRanges.filter(tr => tr.start && tr.end),
        daysOfWeek: surchargeFormData.daysOfWeek,
        holidays: surchargeFormData.holidays
      }

      const payload = {
        name: surchargeFormData.name,
        type: surchargeFormData.type,
        amount: parseFloat(surchargeFormData.amount),
        amountType: surchargeFormData.amountType,
        isActive: surchargeFormData.isActive,
        conditions: Object.keys(conditions).some(key => 
          key === 'holidays' ? conditions.holidays : 
          Array.isArray(conditions[key as keyof typeof conditions]) ? 
            (conditions[key as keyof typeof conditions] as any[]).length > 0 : false
        ) ? conditions : null
      }

      const url = editingSurcharge 
        ? `/api/admin/surcharges/${editingSurcharge.id}` 
        : '/api/admin/surcharges'
      const method = editingSurcharge ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setIsSurchargeDialogOpen(false)
        setEditingSurcharge(null)
        setSurchargeFormData({
          name: '', type: 'TIME_BASED', amount: '', amountType: 'FIXED',
          isActive: true, timeRanges: [{ start: '', end: '' }], daysOfWeek: [], holidays: false
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error saving surcharge:', error)
    }
  }

  const deleteTariff = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/tariffs/${id}`, { method: 'DELETE' })
      if (response.ok) fetchData()
    } catch (error) {
      console.error('Error deleting tariff:', error)
    }
  }

  const deleteSurcharge = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/surcharges/${id}`, { method: 'DELETE' })
      if (response.ok) fetchData()
    } catch (error) {
      console.error('Error deleting surcharge:', error)
    }
  }

  const editTariff = (tariff: TariffRule) => {
    setEditingTariff(tariff)
    setFormData({
      zoneId: tariff.zone?.id || 'general',
      serviceId: tariff.service?.id || '',
      pricingMode: tariff.pricingMode,
      fixedPrice: tariff.fixedPrice?.toString() || '',
      pricePerKm: tariff.pricePerKm?.toString() || '',
      isActive: tariff.isActive
    })
    setIsDialogOpen(true)
  }

  const editSurcharge = (surcharge: Surcharge) => {
    const conditions = surcharge.conditionJson ? JSON.parse(surcharge.conditionJson) : null
    setEditingSurcharge(surcharge)
    setSurchargeFormData({
      name: surcharge.name,
      type: surcharge.type,
      amount: surcharge.amount.toString(),
      amountType: surcharge.amountType,
      isActive: surcharge.isActive,
      timeRanges: conditions?.timeRanges || [{ start: '', end: '' }],
      daysOfWeek: conditions?.daysOfWeek || [],
      holidays: conditions?.holidays || false
    })
    setIsSurchargeDialogOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Tarifas y Recargos</h1>
          <p className="text-gray-600 mt-1">Gestiona las tarifas y recargos del sistema</p>
        </div>
      </div>

      {/* Tariffs Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Tarifas por Zona</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTariff(null)
                setFormData({ zoneId: 'general', serviceId: '', pricingMode: 'FIXED', fixedPrice: '', pricePerKm: '', isActive: true })
              }}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Nueva Tarifa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTariff ? 'Editar Tarifa' : 'Nueva Tarifa'}
                </DialogTitle>
                <DialogDescription>
                  {editingTariff ? 'Modifica los detalles de la tarifa' : 'Crea una nueva regla de tarifa para el servicio seleccionado'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleTariffSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="zone">Zona</Label>
                  <Select value={formData.zoneId} onValueChange={(value) => setFormData({...formData, zoneId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar zona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General (todas las zonas)</SelectItem>
                      {Array.isArray(zones) ? zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                      )) : []}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="service">Servicio</Label>
                  <Select value={formData.serviceId} onValueChange={(value) => setFormData({...formData, serviceId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(services) ? services.map(service => (
                        <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                      )) : []}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pricingMode">Modo de Tarifa</Label>
                  <Select value={formData.pricingMode} onValueChange={(value) => setFormData({...formData, pricingMode: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Precio Fijo</SelectItem>
                      <SelectItem value="PER_KM">Por Kilómetro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.pricingMode === 'FIXED' && (
                  <div>
                    <Label htmlFor="fixedPrice">Precio Fijo (COP)</Label>
                    <Input
                      type="number"
                      value={formData.fixedPrice}
                      onChange={(e) => setFormData({...formData, fixedPrice: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                )}

                {formData.pricingMode === 'PER_KM' && (
                  <div>
                    <Label htmlFor="pricePerKm">Precio por Km (COP)</Label>
                    <Input
                      type="number"
                      value={formData.pricePerKm}
                      onChange={(e) => setFormData({...formData, pricePerKm: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                )}

                <Button type="submit" className="w-full">
                  {editingTariff ? 'Actualizar' : 'Crear'} Tarifa
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {Array.isArray(tariffs) ? tariffs.map((tariff) => (
            <Card key={tariff.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {tariff.zone?.name || 'Zona no especificada'} - {tariff.service?.name || 'Servicio no especificado'}
                    </h3>
                    <Badge variant={tariff.isActive ? 'default' : 'secondary'}>
                      {tariff.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Modo:</strong> {tariff.pricingMode === 'FIXED' ? 'Precio Fijo' : 'Por Kilómetro'}</p>
                    {tariff.fixedPrice && <p><strong>Precio:</strong> ${tariff.fixedPrice.toLocaleString()} COP</p>}
                    {tariff.pricePerKm && <p><strong>Por Km:</strong> ${tariff.pricePerKm.toLocaleString()} COP/km</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => editTariff(tariff)}>
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteTariff(tariff.id)}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )) : []}
        </div>
      </div>

      {/* Surcharges Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recargos</h2>
          <Dialog open={isSurchargeDialogOpen} onOpenChange={setIsSurchargeDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingSurcharge(null)
                setSurchargeFormData({
                  name: '', type: 'TIME_BASED', amount: '', amountType: 'FIXED',
                  isActive: true, timeRanges: [{ start: '', end: '' }], daysOfWeek: [], holidays: false
                })
              }}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Nuevo Recargo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSurcharge ? 'Editar Recargo' : 'Nuevo Recargo'}
                </DialogTitle>
                <DialogDescription>
                  {editingSurcharge ? 'Modifica los detalles del recargo' : 'Crea un nuevo recargo aplicable a las tarifas'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSurchargeSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    value={surchargeFormData.name}
                    onChange={(e) => setSurchargeFormData({...surchargeFormData, name: e.target.value})}
                    placeholder="Ej: Recargo nocturno"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={surchargeFormData.type} onValueChange={(value) => setSurchargeFormData({...surchargeFormData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TIME_BASED">Por Horario</SelectItem>
                      <SelectItem value="DISTANCE_BASED">Por Distancia</SelectItem>
                      <SelectItem value="EXTRA_SERVICE">Servicio Extra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amountType">Tipo de Monto</Label>
                  <Select value={surchargeFormData.amountType} onValueChange={(value) => setSurchargeFormData({...surchargeFormData, amountType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Monto Fijo</SelectItem>
                      <SelectItem value="PERCENTAGE">Porcentaje</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">
                    {surchargeFormData.amountType === 'PERCENTAGE' ? 'Porcentaje (%)' : 'Monto (COP)'}
                  </Label>
                  <Input
                    type="number"
                    value={surchargeFormData.amount}
                    onChange={(e) => setSurchargeFormData({...surchargeFormData, amount: e.target.value})}
                    placeholder="0"
                  />
                </div>

                {surchargeFormData.type === 'TIME_BASED' && (
                  <div>
                    <Label>Horario de Aplicación</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="time"
                        value={surchargeFormData.timeRanges[0].start}
                        onChange={(e) => setSurchargeFormData({
                          ...surchargeFormData,
                          timeRanges: [{ ...surchargeFormData.timeRanges[0], start: e.target.value }]
                        })}
                      />
                      <Input
                        type="time"
                        value={surchargeFormData.timeRanges[0].end}
                        onChange={(e) => setSurchargeFormData({
                          ...surchargeFormData,
                          timeRanges: [{ ...surchargeFormData.timeRanges[0], end: e.target.value }]
                        })}
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  {editingSurcharge ? 'Actualizar' : 'Crear'} Recargo
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {Array.isArray(surcharges) ? surcharges.map((surcharge) => (
            <Card key={surcharge.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{surcharge.name}</h3>
                    <Badge variant={surcharge.isActive ? 'default' : 'secondary'}>
                      {surcharge.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Tipo:</strong> {surcharge.type}</p>
                    <p><strong>Monto:</strong> 
                      {surcharge.amountType === 'PERCENTAGE' 
                        ? `${surcharge.amount}%` 
                        : `$${surcharge.amount.toLocaleString()} COP`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => editSurcharge(surcharge)}>
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteSurcharge(surcharge.id)}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )) : []}
        </div>
      </div>
    </div>
  )
}