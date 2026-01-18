'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Edit, Trash2, Wrench } from 'lucide-react'
import { PageHeader } from '@/components/admin'
import { toast } from 'sonner'

interface EquipmentType {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
}

export default function EquipmentTypesPage() {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<EquipmentType | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true
  })

  const fetchEquipmentTypes = async () => {
    try {
      const response = await fetch('/api/admin/equipment-types')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setEquipmentTypes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading equipment types:', error)
      toast.error('Error al cargar los tipos de equipo')
      setEquipmentTypes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEquipmentTypes()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      isActive: true
    })
  }

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')
    setFormData({ ...formData, name, slug })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingType) {
        const response = await fetch(`/api/admin/equipment-types/${editingType.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Tipo de equipo actualizado')
      } else {
        const response = await fetch('/api/admin/equipment-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Tipo de equipo creado')
      }

      setIsCreateDialogOpen(false)
      setEditingType(null)
      resetForm()
      fetchEquipmentTypes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const handleEdit = (type: EquipmentType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      slug: type.slug,
      description: type.description || '',
      isActive: type.isActive
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Desactivar este tipo de equipo?')) return

    try {
      const response = await fetch(`/api/admin/equipment-types/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('Tipo de equipo desactivado')
      fetchEquipmentTypes()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al desactivar')
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div>
      <PageHeader
        title="Tipos de Equipo"
        description="Tipos de vehiculo o equipo de movilidad"
      />

      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingType(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-3.5 w-3.5" />
              Agregar Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar' : 'Agregar'} Tipo de Equipo
              </DialogTitle>
              <DialogDescription>
                Define un tipo de vehiculo o equipo de movilidad
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Vehiculo con Rampa"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Identificador (slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toUpperCase() })}
                  placeholder="Ej. RAMPA"
                  required
                  disabled={!!editingType}
                  className={editingType ? 'bg-gray-100' : ''}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Usado internamente. No se puede cambiar despues de crear.
                </p>
              </div>

              <div>
                <Label htmlFor="description">Descripcion (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripcion del tipo de equipo"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="active">Activo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  {editingType ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Identificador</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Descripcion</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {equipmentTypes.filter(t => t.isActive).map((type) => (
              <tr key={type.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-medium text-gray-900">{type.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{type.slug}</code>
                </td>
                <td className="px-3 py-2.5 text-gray-600">
                  {type.description || <span className="text-gray-400">-</span>}
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant="outline" className="text-[10px] border-green-200 text-green-700 bg-green-50">
                    Activo
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inactive types */}
      {equipmentTypes.filter(t => !t.isActive).length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Tipos Inactivos</h2>
          <div className="bg-white border border-gray-100 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Identificador</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {equipmentTypes.filter(t => !t.isActive).map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2">{type.name}</td>
                    <td className="px-3 py-2">
                      <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{type.slug}</code>
                    </td>
                    <td className="px-3 py-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {equipmentTypes.length === 0 && (
        <div className="text-center py-8">
          <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No hay tipos de equipo</p>
          <p className="text-xs text-gray-400">Agrega un tipo de vehiculo o equipo</p>
        </div>
      )}
    </div>
  )
}
