'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, Edit, Trash2, RefreshCw, Zap, Package } from 'lucide-react'
import { PageHeader } from '@/components/admin'
import { toast } from 'sonner'

interface Surcharge {
  id: string
  code: string
  name: string
  price: number
  description: string | null
  startHour: number | null
  endHour: number | null
}

interface AdditionalService {
  id: string
  code: string
  name: string
  price: number
  priceType: string
  description: string | null
}

export default function ExtrasPage() {
  const [surcharges, setSurcharges] = useState<Surcharge[]>([])
  const [services, setServices] = useState<AdditionalService[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('surcharges')

  // Surcharge form
  const [isSurchargeDialogOpen, setIsSurchargeDialogOpen] = useState(false)
  const [editingSurcharge, setEditingSurcharge] = useState<Surcharge | null>(null)
  const [surchargeForm, setSurchargeForm] = useState({
    code: '',
    name: '',
    price: '',
    description: '',
    startHour: '',
    endHour: ''
  })

  // Service form
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<AdditionalService | null>(null)
  const [serviceForm, setServiceForm] = useState({
    code: '',
    name: '',
    price: '',
    priceType: 'FIJO',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [surchargesRes, servicesRes] = await Promise.all([
        fetch('/api/admin/surcharges'),
        fetch('/api/admin/additional-services')
      ])

      if (surchargesRes.ok) {
        const data = await surchargesRes.json()
        setSurcharges(Array.isArray(data) ? data : [])
      }
      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setServices(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Surcharge handlers
  const resetSurchargeForm = () => {
    setSurchargeForm({ code: '', name: '', price: '', description: '', startHour: '', endHour: '' })
  }

  const handleSurchargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingSurcharge
        ? `/api/admin/surcharges/${editingSurcharge.id}`
        : '/api/admin/surcharges'

      const res = await fetch(url, {
        method: editingSurcharge ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: surchargeForm.code,
          name: surchargeForm.name,
          price: parseInt(surchargeForm.price),
          description: surchargeForm.description || null,
          startHour: surchargeForm.startHour ? parseInt(surchargeForm.startHour) : null,
          endHour: surchargeForm.endHour ? parseInt(surchargeForm.endHour) : null
        })
      })

      if (res.ok) {
        toast.success(editingSurcharge ? 'Recargo actualizado' : 'Recargo creado')
        setIsSurchargeDialogOpen(false)
        setEditingSurcharge(null)
        resetSurchargeForm()
        fetchData()
      } else {
        toast.error('Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  const handleEditSurcharge = (surcharge: Surcharge) => {
    setEditingSurcharge(surcharge)
    setSurchargeForm({
      code: surcharge.code,
      name: surcharge.name,
      price: surcharge.price.toString(),
      description: surcharge.description || '',
      startHour: surcharge.startHour?.toString() || '',
      endHour: surcharge.endHour?.toString() || ''
    })
    setIsSurchargeDialogOpen(true)
  }

  const handleDeleteSurcharge = async (id: string) => {
    if (!confirm('¿Eliminar este recargo?')) return
    try {
      const res = await fetch(`/api/admin/surcharges/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Recargo eliminado')
        fetchData()
      } else {
        toast.error('Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  // Service handlers
  const resetServiceForm = () => {
    setServiceForm({ code: '', name: '', price: '', priceType: 'FIJO', description: '' })
  }

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingService
        ? `/api/admin/additional-services/${editingService.id}`
        : '/api/admin/additional-services'

      const res = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...serviceForm,
          price: parseInt(serviceForm.price)
        })
      })

      if (res.ok) {
        toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado')
        setIsServiceDialogOpen(false)
        setEditingService(null)
        resetServiceForm()
        fetchData()
      } else {
        toast.error('Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  const handleEditService = (service: AdditionalService) => {
    setEditingService(service)
    setServiceForm({
      code: service.code,
      name: service.name,
      price: service.price.toString(),
      priceType: service.priceType,
      description: service.description || ''
    })
    setIsServiceDialogOpen(true)
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      const res = await fetch(`/api/admin/additional-services/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Servicio eliminado')
        fetchData()
      } else {
        toast.error('Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const formatPrice = (price: number) => `$${price.toLocaleString()}`
  const getPriceTypeLabel = (type: string) => {
    switch (type) {
      case 'FIJO': return 'Fijo'
      case 'POR_HORA': return 'Por hora'
      case 'POR_UNIDAD': return 'Por unidad'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Extras y Recargos"
        description="Recargos automaticos y servicios opcionales"
        actions={
          <Button size="sm" variant="outline" onClick={fetchData}>
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Actualizar
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="surcharges" className="text-xs">
            <Zap className="w-3 h-3 mr-1.5" />
            Recargos Automaticos ({surcharges.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="text-xs">
            <Package className="w-3 h-3 mr-1.5" />
            Servicios Opcionales ({services.length})
          </TabsTrigger>
        </TabsList>

        {/* Recargos Automáticos */}
        <TabsContent value="surcharges">
          <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-4">
            <p className="text-xs text-blue-700">
              <Zap className="w-3 h-3 inline mr-1" />
              Los recargos se aplican <strong>automaticamente</strong> segun condiciones (horario nocturno, festivos, etc.)
            </p>
          </div>

          <div className="flex justify-end mb-3">
            <Dialog open={isSurchargeDialogOpen} onOpenChange={(open) => {
              setIsSurchargeDialogOpen(open)
              if (!open) {
                setEditingSurcharge(null)
                resetSurchargeForm()
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="w-3 h-3 mr-1.5" />
                  Nuevo Recargo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingSurcharge ? 'Editar' : 'Nuevo'} Recargo</DialogTitle>
                  <DialogDescription>Recargo que se aplica automaticamente</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSurchargeSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Codigo</Label>
                      <Input
                        value={surchargeForm.code}
                        onChange={(e) => setSurchargeForm({...surchargeForm, code: e.target.value.toUpperCase()})}
                        placeholder="Ej: NOCTURNO"
                        required
                      />
                    </div>
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={surchargeForm.name}
                        onChange={(e) => setSurchargeForm({...surchargeForm, name: e.target.value})}
                        placeholder="Ej: Recargo Nocturno"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Precio (COP)</Label>
                    <Input
                      type="number"
                      value={surchargeForm.price}
                      onChange={(e) => setSurchargeForm({...surchargeForm, price: e.target.value})}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <Label>Descripcion</Label>
                    <Textarea
                      value={surchargeForm.description}
                      onChange={(e) => setSurchargeForm({...surchargeForm, description: e.target.value})}
                      placeholder="Cuando se aplica este recargo..."
                      rows={2}
                    />
                  </div>
                  {/* Campos de horario (solo para recargos basados en hora como NOCTURNO) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Hora Inicio (0-23)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={surchargeForm.startHour}
                        onChange={(e) => setSurchargeForm({...surchargeForm, startHour: e.target.value})}
                        placeholder="Ej: 18 para 6PM"
                      />
                    </div>
                    <div>
                      <Label>Hora Fin (0-23)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={surchargeForm.endHour}
                        onChange={(e) => setSurchargeForm({...surchargeForm, endHour: e.target.value})}
                        placeholder="Ej: 6 para 6AM"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">Los campos de hora solo aplican para recargos como NOCTURNO. Dejar vacios si no aplica.</p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsSurchargeDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm">{editingSurcharge ? 'Guardar' : 'Crear'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {surcharges.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Codigo</th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Descripcion</th>
                    <th className="px-3 py-2 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {surcharges.map(surcharge => (
                    <tr key={surcharge.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <code className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">{surcharge.code}</code>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">{surcharge.name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatPrice(surcharge.price)}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">{surcharge.description || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => handleEditSurcharge(surcharge)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSurcharge(surcharge.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded p-8 text-center">
              <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay recargos configurados</p>
            </div>
          )}
        </TabsContent>

        {/* Servicios Opcionales */}
        <TabsContent value="services">
          <div className="bg-green-50 border border-green-100 rounded p-3 mb-4">
            <p className="text-xs text-green-700">
              <Package className="w-3 h-3 inline mr-1" />
              Los servicios opcionales se agregan <strong>manualmente</strong> al crear una cita
            </p>
          </div>

          <div className="flex justify-end mb-3">
            <Dialog open={isServiceDialogOpen} onOpenChange={(open) => {
              setIsServiceDialogOpen(open)
              if (!open) {
                setEditingService(null)
                resetServiceForm()
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="w-3 h-3 mr-1.5" />
                  Nuevo Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingService ? 'Editar' : 'Nuevo'} Servicio</DialogTitle>
                  <DialogDescription>Servicio opcional para agregar a citas</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleServiceSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Codigo</Label>
                      <Input
                        value={serviceForm.code}
                        onChange={(e) => setServiceForm({...serviceForm, code: e.target.value.toUpperCase()})}
                        placeholder="Ej: HORA_ESPERA"
                        required
                      />
                    </div>
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={serviceForm.name}
                        onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                        placeholder="Ej: Hora de espera"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Precio (COP)</Label>
                      <Input
                        type="number"
                        value={serviceForm.price}
                        onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <Label>Tipo de Precio</Label>
                      <Select value={serviceForm.priceType} onValueChange={(v) => setServiceForm({...serviceForm, priceType: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIJO">Fijo</SelectItem>
                          <SelectItem value="POR_HORA">Por hora</SelectItem>
                          <SelectItem value="POR_UNIDAD">Por unidad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Descripcion</Label>
                    <Textarea
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      placeholder="Descripcion del servicio..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsServiceDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm">{editingService ? 'Guardar' : 'Crear'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {services.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Codigo</th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-3 py-2 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {services.map(service => (
                    <tr key={service.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{service.code}</code>
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">{service.name}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          service.priceType === 'FIJO' ? 'bg-blue-50 text-blue-700' :
                          service.priceType === 'POR_HORA' ? 'bg-purple-50 text-purple-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          {getPriceTypeLabel(service.priceType)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatPrice(service.price)}</td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => handleEditService(service)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteService(service.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded p-8 text-center">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay servicios opcionales configurados</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
