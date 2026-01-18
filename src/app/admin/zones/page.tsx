'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Edit, Trash2, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/admin'
import { toast } from 'sonner'

interface Zone {
  id: string
  name: string
  slug: string
  isMetro: boolean
  _count?: {
    rates: number
  }
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    isMetro: true
  })

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/admin/zones')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setZones(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading zones:', error)
      toast.error('Error al cargar las zonas')
      setZones([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchZones()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      isMetro: true
    })
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setFormData({ ...formData, name, slug })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingZone) {
        const response = await fetch(`/api/admin/zones/${editingZone.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            isMetro: formData.isMetro
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Zona actualizada')
      } else {
        const response = await fetch('/api/admin/zones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Zona creada')
      }

      setIsCreateDialogOpen(false)
      setEditingZone(null)
      resetForm()
      fetchZones()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      slug: zone.slug,
      isMetro: zone.isMetro
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const zone = zones.find(z => z.id === id)
    if (zone?._count?.rates && zone._count.rates > 0) {
      toast.error(`No se puede eliminar: tiene ${zone._count.rates} tarifas asociadas`)
      return
    }

    if (!confirm('¿Eliminar esta zona?')) return

    try {
      const response = await fetch(`/api/admin/zones/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('Zona eliminada')
      fetchZones()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  // Separate metro zones and out-of-city
  const metroZones = zones.filter(z => z.isMetro)
  const outOfCityZones = zones.filter(z => !z.isMetro)

  return (
    <div>
      <PageHeader
        title="Zonas"
        description="Zonas geograficas para tarifas"
      />

      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingZone(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-3.5 w-3.5" />
              Agregar Zona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Editar' : 'Agregar'} Zona
              </DialogTitle>
              <DialogDescription>
                Define una zona geografica para configurar tarifas
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. RIONEGRO, ABEJORRAL"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Identificador (slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  placeholder="Ej. rionegro, abejorral"
                  required
                  disabled={!!editingZone}
                  className={editingZone ? 'bg-gray-100' : ''}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Usado internamente. No se puede cambiar despues de crear.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isMetro"
                  checked={formData.isMetro}
                  onCheckedChange={(checked) => setFormData({ ...formData, isMetro: checked })}
                />
                <Label htmlFor="isMetro">Area Metropolitana</Label>
              </div>
              <p className="text-[10px] text-gray-500 -mt-2">
                Activa si la zona es parte del Valle de Aburra. Desactiva para destinos fuera de la ciudad.
              </p>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  {editingZone ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metro Zones */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Area Metropolitana
        </h2>
        <div className="bg-white border border-gray-100 rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Identificador</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Tarifas</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {metroZones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-gray-900">{zone.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{zone.slug}</code>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className="text-[10px]">
                      {zone._count?.rates || 0} tarifas
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(zone)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(zone.id)}
                        disabled={(zone._count?.rates ?? 0) > 0}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {metroZones.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                    No hay zonas metropolitanas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Out of City Zones */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Fuera de la Ciudad
        </h2>
        <div className="bg-white border border-gray-100 rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Identificador</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Tarifas</th>
                <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {outOfCityZones.map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-orange-500" />
                      <span className="font-medium text-gray-900">{zone.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{zone.slug}</code>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className="text-[10px]">
                      {zone._count?.rates || 0} tarifas
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(zone)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(zone.id)}
                        disabled={(zone._count?.rates ?? 0) > 0}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {outOfCityZones.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                    No hay zonas fuera de la ciudad
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
        <p className="font-medium mb-1">Nota sobre zonas:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-600">
          <li><strong>Area Metropolitana:</strong> Zonas dentro del Valle de Aburra (Medellin, Bello, Envigado, etc.)</li>
          <li><strong>Fuera de la Ciudad:</strong> Destinos especiales como Aeropuerto JMC, Rionegro, etc. Las tarifas de estas zonas se configuran como "Rutas" en la seccion de Tarifas.</li>
        </ul>
      </div>
    </div>
  )
}
