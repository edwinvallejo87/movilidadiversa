'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, Edit, MapPin, RefreshCw, Trash2, Route } from 'lucide-react'
import { PageHeader } from '@/components/admin'
import { toast } from 'sonner'

interface Zone {
  id: string
  name: string
  slug: string
  isMetro: boolean
}

interface Rate {
  id: string
  zoneId: string
  tripType: string
  equipmentType: string
  originType: string | null
  distanceRange: string | null
  destinationName: string | null
  price: number
}

interface EquipmentType {
  id: string
  name: string
  slug: string
  isActive: boolean
}

interface OutOfCityDestination {
  id: string
  name: string
  tripType: string
  equipmentType: string
  originType: string | null
  price: number
}

export default function TariffsPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([])
  const [outOfCityDestinations, setOutOfCityDestinations] = useState<OutOfCityDestination[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<string>('zonas')

  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<Rate | null>(null)
  const [ratePrice, setRatePrice] = useState('')

  // Create modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRate, setNewRate] = useState({
    zoneId: '',
    tripType: 'SENCILLO',
    equipmentType: 'RAMPA',
    originType: '',
    distanceRange: '',
    destinationName: '',
    price: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [zonesRes, ratesRes, equipmentTypesRes, outOfCityRes] = await Promise.all([
        fetch('/api/admin/zones'),
        fetch('/api/admin/rates'),
        fetch('/api/admin/equipment-types'),
        fetch('/api/admin/out-of-city-destinations')
      ])

      if (zonesRes.ok) {
        const data = await zonesRes.json()
        setZones(Array.isArray(data) ? data : [])
      }
      if (ratesRes.ok) {
        const data = await ratesRes.json()
        setRates(Array.isArray(data) ? data : [])
      }
      if (equipmentTypesRes.ok) {
        const data = await equipmentTypesRes.json()
        setEquipmentTypes(Array.isArray(data) ? data.filter((t: EquipmentType) => t.isActive) : [])
      }
      if (outOfCityRes.ok) {
        const data = await outOfCityRes.json()
        setOutOfCityDestinations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleEditRate = (rate: Rate) => {
    setEditingRate(rate)
    setRatePrice(rate.price.toString())
    setIsEditOpen(true)
  }

  const handleUpdateRate = async () => {
    if (!editingRate) return

    try {
      const response = await fetch(`/api/admin/rates/${editingRate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseInt(ratePrice) })
      })

      if (response.ok) {
        toast.success('Tarifa actualizada')
        setIsEditOpen(false)
        fetchData()
      } else {
        toast.error('Error al actualizar')
      }
    } catch (error) {
      toast.error('Error al actualizar')
    }
  }

  const handleCreateRate = async () => {
    const selectedZoneData = zones.find(z => z.id === newRate.zoneId)
    const isOutOfCity = selectedZoneData?.slug === 'fuera-ciudad'

    // Validation
    if (!newRate.zoneId || newRate.price === '' || newRate.price === undefined) {
      toast.error('Completa todos los campos requeridos')
      return
    }

    if (isOutOfCity && !newRate.destinationName) {
      toast.error('Ingresa el nombre del destino')
      return
    }

    try {
      const response = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: newRate.zoneId,
          tripType: newRate.tripType,
          equipmentType: newRate.equipmentType,
          originType: newRate.originType || null,
          distanceRange: newRate.distanceRange || null,
          destinationName: isOutOfCity ? newRate.destinationName : null,
          price: parseInt(newRate.price)
        })
      })

      if (response.ok) {
        toast.success('Tarifa creada')
        setIsCreateOpen(false)
        resetNewRate()
        fetchData()
      } else {
        toast.error('Error al crear tarifa')
      }
    } catch (error) {
      toast.error('Error al crear tarifa')
    }
  }

  const resetNewRate = () => {
    setNewRate({
      zoneId: '',
      tripType: 'SENCILLO',
      equipmentType: 'RAMPA',
      originType: '',
      distanceRange: '',
      destinationName: '',
      price: ''
    })
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm('¿Eliminar esta tarifa?')) return

    try {
      const response = await fetch(`/api/admin/rates/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Tarifa eliminada')
        fetchData()
      } else {
        toast.error('Error al eliminar')
      }
    } catch (error) {
      toast.error('Error al eliminar')
    }
  }

  const formatPrice = (price: number) => `$${price.toLocaleString()}`
  const getTripTypeLabel = (type: string) => type === 'SENCILLO' ? 'Sencillo' : 'Doble'
  const getEquipmentLabel = (slug: string) => {
    const type = equipmentTypes.find(t => t.slug === slug)
    if (type) return type.name
    if (slug === 'RAMPA') return 'Rampa'
    if (slug === 'ROBOTICA_PLEGABLE') return 'Robotica/Plegable'
    return slug
  }

  const getDistanceLabel = (range: string | null) => {
    if (!range) return '-'
    if (range === 'HASTA_3KM') return '≤3 km'
    if (range === 'DE_3_A_10KM') return '3-10 km'
    if (range === 'MAS_10KM') return '>10 km'
    return range
  }

  const getOriginLabel = (type: string | null) => {
    if (!type) return '-'
    if (type === 'DESDE_MEDELLIN') return 'Desde Medellin'
    if (type === 'MISMO_MUNICIPIO' || type === 'MISMA_CIUDAD') return 'Misma Ciudad'
    return type
  }

  // Separate metropolitan zones only (isMetro = true)
  const metroZones = zones.filter(z => z.isMetro)

  // Get rates for metro zones only
  const zoneRates = rates.filter(r => {
    const zone = zones.find(z => z.id === r.zoneId)
    return zone && zone.isMetro
  })

  const filteredZones = selectedZone === 'all'
    ? metroZones
    : metroZones.filter(z => z.id === selectedZone)

  const selectedZoneData = zones.find(z => z.id === newRate.zoneId)

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
        title="Tarifas"
        description="Precios por zona y rutas fuera de ciudad"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchData}>
              <RefreshCw className="w-3 h-3 mr-1.5" />
              Actualizar
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open)
              if (!open) resetNewRate()
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="w-3 h-3 mr-1.5" />
                  Nueva Tarifa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nueva Tarifa</DialogTitle>
                  <DialogDescription>
                    Crear tarifa para zona metropolitana
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={newRate.zoneId}
                      onValueChange={(v) => setNewRate({...newRate, zoneId: v, originType: '', distanceRange: '', destinationName: ''})}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent>
                        {metroZones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo de Viaje</Label>
                      <Select value={newRate.tripType} onValueChange={(v) => setNewRate({...newRate, tripType: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SENCILLO">Sencillo</SelectItem>
                          <SelectItem value="DOBLE">Doble</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tipo de Equipo</Label>
                      <Select value={newRate.equipmentType} onValueChange={(v) => setNewRate({...newRate, equipmentType: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {equipmentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.slug}>{type.name}</SelectItem>
                          ))}
                          {equipmentTypes.length === 0 && (
                            <>
                              <SelectItem value="RAMPA">Rampa</SelectItem>
                              <SelectItem value="ROBOTICA_PLEGABLE">Robotica/Plegable</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedZoneData?.slug === 'medellin' && !(newRate.price === '0' || (newRate.price !== '' && parseInt(newRate.price) === 0)) && (
                    <div>
                      <Label>Rango de Distancia</Label>
                      <Select value={newRate.distanceRange} onValueChange={(v) => setNewRate({...newRate, distanceRange: v})}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HASTA_3KM">Hasta 3 km</SelectItem>
                          <SelectItem value="DE_3_A_10KM">3 a 10 km</SelectItem>
                          <SelectItem value="MAS_10KM">Mas de 10 km</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedZoneData && selectedZoneData.slug !== 'medellin' && selectedZoneData.slug !== 'fuera-ciudad' && (
                    <div>
                      <Label>Tipo de Origen</Label>
                      <Select value={newRate.originType} onValueChange={(v) => setNewRate({...newRate, originType: v})}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DESDE_MEDELLIN">Desde Medellin</SelectItem>
                          <SelectItem value="MISMO_MUNICIPIO">Mismo Municipio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>Precio (COP)</Label>
                    <Input
                      type="number"
                      value={newRate.price}
                      onChange={(e) => setNewRate({...newRate, price: e.target.value})}
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                    <Button size="sm" onClick={handleCreateRate}>Crear</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Tabs: Zonas / Rutas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="zonas" className="text-xs">
            <MapPin className="w-3 h-3 mr-1.5" />
            Zona Metropolitana ({zoneRates.length})
          </TabsTrigger>
          <TabsTrigger value="rutas" className="text-xs">
            <Route className="w-3 h-3 mr-1.5" />
            Rutas Fuera de Ciudad ({outOfCityDestinations.length})
          </TabsTrigger>
        </TabsList>

        {/* ZONAS TAB */}
        <TabsContent value="zonas" className="space-y-4 mt-4">
          {/* Zone Filter */}
          <div className="flex items-center gap-3">
            <Label className="text-xs">Filtrar:</Label>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {metroZones.map(zone => (
                  <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rates by Zone */}
          {filteredZones.map(zone => {
            const zoneSpecificRates = rates.filter(r => r.zoneId === zone.id)

            return (
              <div key={zone.id} className="bg-white border border-gray-100 rounded overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-900">{zone.name}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                    {zone.slug === 'medellin' ? 'Por distancia' : 'Por origen'}
                  </span>
                </div>

                {zoneSpecificRates.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Viaje</th>
                          <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Equipo</th>
                          <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">
                            {zone.slug === 'medellin' ? 'Distancia' : 'Origen'}
                          </th>
                          <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">Precio</th>
                          <th className="px-3 py-2 w-20"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {zoneSpecificRates.map(rate => (
                          <tr key={rate.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                rate.tripType === 'SENCILLO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                              }`}>
                                {getTripTypeLabel(rate.tripType)}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                                {getEquipmentLabel(rate.equipmentType)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {zone.slug === 'medellin' ? getDistanceLabel(rate.distanceRange) : getOriginLabel(rate.originType)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatPrice(rate.price)}</td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-0.5">
                                <Button variant="ghost" size="sm" onClick={() => handleEditRate(rate)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteRate(rate.id)}>
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
                  <div className="p-4 text-center text-xs text-gray-500">
                    No hay tarifas configuradas
                  </div>
                )}
              </div>
            )
          })}
        </TabsContent>

        {/* RUTAS TAB */}
        <TabsContent value="rutas" className="space-y-4 mt-4">
          {(() => {
            // Group out-of-city destinations by name
            const destinationNames = [...new Set(outOfCityDestinations.map(d => d.name))]

            if (destinationNames.length > 0) {
              return destinationNames.map(destName => {
                const destItems = outOfCityDestinations.filter(d => d.name === destName)

                return (
                  <div key={destName} className="bg-white border border-gray-100 rounded overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                      <Route className="w-3.5 h-3.5 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-900">{destName}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700">
                        Precio fijo
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Viaje</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Equipo</th>
                            <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Origen</th>
                            <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase">Precio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {destItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  item.tripType === 'SENCILLO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                                }`}>
                                  {getTripTypeLabel(item.tripType)}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                                  {getEquipmentLabel(item.equipmentType)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {getOriginLabel(item.originType)}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatPrice(item.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })
            } else {
              return (
                <div className="bg-white border border-gray-100 rounded p-8 text-center">
                  <Route className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay rutas configuradas</p>
                  <p className="text-xs text-gray-400 mt-1">Contactar administrador para agregar rutas fuera de ciudad</p>
                </div>
              )
            }
          })()}
        </TabsContent>
      </Tabs>

      {/* Edit Rate Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Tarifa</DialogTitle>
            <DialogDescription>Actualizar precio</DialogDescription>
          </DialogHeader>
          {editingRate && (
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                {editingRate.destinationName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Destino:</span>
                    <span className="font-medium">{editingRate.destinationName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Viaje:</span>
                  <span className="font-medium">{getTripTypeLabel(editingRate.tripType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Equipo:</span>
                  <span className="font-medium">{getEquipmentLabel(editingRate.equipmentType)}</span>
                </div>
                {editingRate.distanceRange && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Distancia:</span>
                    <span className="font-medium">{getDistanceLabel(editingRate.distanceRange)}</span>
                  </div>
                )}
                {editingRate.originType && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Origen:</span>
                    <span className="font-medium">{getOriginLabel(editingRate.originType)}</span>
                  </div>
                )}
              </div>
              <div>
                <Label>Precio (COP)</Label>
                <Input
                  type="number"
                  value={ratePrice}
                  onChange={(e) => setRatePrice(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                <Button size="sm" onClick={handleUpdateRate}>Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
