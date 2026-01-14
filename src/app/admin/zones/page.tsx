'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PlusCircle, Edit, Trash2, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface Zone {
  id: string
  name: string
  slug: string
  isMetro: boolean
  createdAt: string
  _count: {
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
      const data = await response.json()
      setZones(data)
    } catch (error) {
      toast.error('Error al cargar las zonas')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingZone) {
        const response = await fetch(`/api/admin/zones/${editingZone.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Zona actualizada correctamente')
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

        toast.success('Zona creada correctamente')
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
    if (!confirm('¿Estás seguro de que quieres eliminar esta zona?')) return

    try {
      const response = await fetch(`/api/admin/zones/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('Zona eliminada correctamente')
      fetchZones()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Zonas</h1>
        <p className="text-gray-600">Administra zonas geográficas y tarifas por región</p>
      </div>

      <div className="flex justify-end mb-8">
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingZone(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <button className="pro-btn pro-btn-primary">
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Zona
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? 'Editar' : 'Agregar'} Zona
              </DialogTitle>
              <DialogDescription>
                Completa la información de la zona geográfica
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Zona</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej. MEDELLIN"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="Ej. medellin"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isMetro"
                  checked={formData.isMetro}
                  onCheckedChange={(checked) => setFormData({...formData, isMetro: checked})}
                />
                <Label htmlFor="isMetro">Zona metropolitana</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" className="pro-btn pro-btn-secondary" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="pro-btn pro-btn-primary">
                  {editingZone ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {zones.map((zone) => (
          <div key={zone.id} className="dashboard-card relative">
            <div className="card-header pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="dashboard-icon">
                    {zone.isMetro ? '🏢' : '✈️'}
                  </div>
                  <h3 className="card-title">{zone.name}</h3>
                </div>
                <div className="flex space-x-1">
                  <button
                    className="pro-btn pro-btn-secondary px-2 py-1 mr-1"
                    onClick={() => handleEdit(zone)}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="pro-btn pro-btn-secondary px-2 py-1"
                    onClick={() => handleDelete(zone.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Slug
                  </span>
                  <span className="font-semibold">{zone.slug}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tipo</span>
                  <span className={`status-badge ${
                    zone.isMetro ? 'status-available' : 'status-busy'
                  }`}>
                    {zone.isMetro ? 'Metropolitana' : 'Fuera de Ciudad'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tarifas</span>
                  <span className="status-badge status-available">{zone._count.rates}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Creada: {new Date(zone.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {zones.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay zonas configuradas</p>
        </div>
      )}
    </div>
  )
}