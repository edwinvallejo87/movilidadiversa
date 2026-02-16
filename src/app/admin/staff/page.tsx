'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { PlusCircle, Edit, Trash2, Car, Phone, Mail, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/admin'
import { toast } from 'sonner'

interface Staff {
  id: string
  name: string
  type: string
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE'
  phone?: string
  email?: string
  color: string
  licensePlate?: string
  vehicleModel?: string
  capacity?: number
  isWheelchairAccessible: boolean
  equipmentType: string
  licenseNumber?: string
  workDays: string
  workStartTime: string
  workEndTime: string
  isActive: boolean
  _count: {
    appointments: number
    unavailability: number
  }
}

interface EquipmentType {
  id: string
  name: string
  slug: string
  isActive: boolean
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    status: 'AVAILABLE' as 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE',
    phone: '',
    email: '',
    color: '#3B82F6',
    licensePlate: '',
    vehicleModel: '',
    capacity: '',
    equipmentType: 'RAMPA',
    licenseNumber: '',
    workDays: '1,2,3,4,5',
    workStartTime: '07:00',
    workEndTime: '19:00',
    isActive: true
  })

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/staff')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      setStaff(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading staff:', error)
      toast.error('Error al cargar el personal')
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipmentTypes = async () => {
    try {
      const response = await fetch('/api/admin/equipment-types')
      if (response.ok) {
        const data = await response.json()
        setEquipmentTypes(Array.isArray(data) ? data.filter((t: EquipmentType) => t.isActive) : [])
      }
    } catch (error) {
      console.error('Error loading equipment types:', error)
    }
  }

  useEffect(() => {
    fetchStaff()
    fetchEquipmentTypes()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'AVAILABLE',
      phone: '',
      email: '',
      color: '#3B82F6',
      licensePlate: '',
      vehicleModel: '',
      capacity: '',
      equipmentType: 'RAMPA',
      licenseNumber: '',
      workDays: '1,2,3,4,5',
      workStartTime: '07:00',
      workEndTime: '19:00',
      isActive: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const submitData = {
        ...formData,
        type: 'DRIVER',
        email: formData.email?.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        isWheelchairAccessible: true
      }

      if (editingStaff) {
        const response = await fetch(`/api/admin/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Conductor actualizado correctamente')
      } else {
        const response = await fetch('/api/admin/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Conductor creado correctamente')
      }

      setIsCreateDialogOpen(false)
      setEditingStaff(null)
      resetForm()
      fetchStaff()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setFormData({
      name: staffMember.name,
      status: staffMember.status,
      phone: staffMember.phone || '',
      email: staffMember.email || '',
      color: staffMember.color || '#3B82F6',
      licensePlate: staffMember.licensePlate || '',
      vehicleModel: staffMember.vehicleModel || '',
      capacity: staffMember.capacity?.toString() || '',
      equipmentType: staffMember.equipmentType || 'RAMPA',
      licenseNumber: staffMember.licenseNumber || '',
      workDays: staffMember.workDays,
      workStartTime: staffMember.workStartTime,
      workEndTime: staffMember.workEndTime,
      isActive: staffMember.isActive
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este conductor?')) return

    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('Conductor desactivado correctamente')
      fetchStaff()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al desactivar')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700'
      case 'BUSY': return 'bg-yellow-100 text-yellow-700'
      case 'OFFLINE': return 'bg-gray-100 text-gray-600'
      case 'MAINTENANCE': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'Disponible'
      case 'BUSY': return 'Ocupado'
      case 'OFFLINE': return 'Desconectado'
      case 'MAINTENANCE': return 'Mantenimiento'
      default: return status
    }
  }

  const workDaysMap: Record<string, string> = {
    '1': 'Lun',
    '2': 'Mar',
    '3': 'Mie',
    '4': 'Jue',
    '5': 'Vie',
    '6': 'Sab',
    '7': 'Dom'
  }

  const formatWorkDays = (days: string) => {
    return days.split(',').map(d => workDaysMap[d] || d).join(', ')
  }

  const getEquipmentName = (slug: string) => {
    const type = equipmentTypes.find(t => t.slug === slug)
    if (type) return type.name
    // Fallback for legacy slugs
    if (slug === 'RAMPA') return 'Vehiculo con Rampa'
    if (slug === 'ROBOTICA_PLEGABLE') return 'Silla Robotica/Plegable'
    return slug
  }

  const getEquipmentShortName = (slug: string) => {
    const type = equipmentTypes.find(t => t.slug === slug)
    if (type) {
      // Return a short version: take first word or max 10 chars
      return type.name.split(' ')[0].substring(0, 10)
    }
    if (slug === 'RAMPA') return 'Rampa'
    if (slug === 'ROBOTICA_PLEGABLE') return 'Robotica'
    return slug.substring(0, 10)
  }

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div>
      <PageHeader
        title="Conductores y Vehiculos"
        description="Cada conductor tiene asignado un vehiculo"
      />

      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingStaff(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Conductor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Editar' : 'Agregar'} Conductor
              </DialogTitle>
              <DialogDescription>
                Informacion del conductor y su vehiculo asignado
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Datos del conductor */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Datos del Conductor</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Disponible</SelectItem>
                        <SelectItem value="BUSY">Ocupado</SelectItem>
                        <SelectItem value="OFFLINE">Desconectado</SelectItem>
                        <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="phone">Telefono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="300 123 4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="conductor@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="licenseNumber">Numero de Licencia</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    placeholder="Licencia de conducir"
                  />
                </div>

                <div>
                  <Label>Color (para calendario)</Label>
                  <div className="flex gap-1.5 mt-1">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded border-2 transition-colors ${formData.color === color ? 'border-gray-900' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({...formData, color})}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Datos del vehiculo */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Datos del Vehiculo</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="licensePlate">Placa</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})}
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleModel">Modelo</Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                      placeholder="Mercedes Sprinter"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="equipmentType">Tipo de Equipo</Label>
                    <Select value={formData.equipmentType} onValueChange={(value) => setFormData({...formData, equipmentType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.slug}>{type.name}</SelectItem>
                        ))}
                        {equipmentTypes.length === 0 && (
                          <>
                            <SelectItem value="RAMPA">Vehiculo con Rampa</SelectItem>
                            <SelectItem value="ROBOTICA_PLEGABLE">Silla Robotica/Plegable</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacidad</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      placeholder="4"
                    />
                  </div>
                </div>
              </div>

              {/* Horario */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Horario de Trabajo</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="workStartTime">Hora Inicio</Label>
                    <Input
                      id="workStartTime"
                      type="time"
                      value={formData.workStartTime}
                      onChange={(e) => setFormData({...formData, workStartTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workEndTime">Hora Fin</Label>
                    <Input
                      id="workEndTime"
                      type="time"
                      value={formData.workEndTime}
                      onChange={(e) => setFormData({...formData, workEndTime: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="workDays">Dias de Trabajo</Label>
                  <Input
                    id="workDays"
                    value={formData.workDays}
                    onChange={(e) => setFormData({...formData, workDays: e.target.value})}
                    placeholder="1,2,3,4,5"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab, 7=Dom
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="active">Activo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm">
                  {editingStaff ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de conductores */}
      <div className="bg-white border border-gray-100 rounded overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Conductor</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Vehiculo</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Contacto</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Horario</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Citas</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staff.filter(s => s.isActive).map((member) => (
              <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: member.color }} />
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      {member.licenseNumber && (
                        <p className="text-[10px] text-gray-400">Lic: {member.licenseNumber}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-3 h-3 text-gray-400" />
                    <div>
                      <p className="text-gray-700">{member.vehicleModel || '-'}</p>
                      <p className="text-[10px] text-gray-400">{member.licensePlate || 'Sin placa'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-blue-200 text-blue-700 bg-blue-50"
                  >
                    {getEquipmentShortName(member.equipmentType)}
                  </Badge>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getStatusColor(member.status)}`}>
                    {getStatusLabel(member.status)}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="space-y-0.5 text-gray-600">
                    {member.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {member.phone}
                      </div>
                    )}
                    {member.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {member.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="text-gray-600">
                    <p>{formatWorkDays(member.workDays)}</p>
                    <p className="text-[10px] text-gray-400">{member.workStartTime} - {member.workEndTime}</p>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className="text-gray-700 font-medium">{member._count.appointments}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Conductores inactivos */}
      {staff.filter(s => !s.isActive).length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3">Conductores Inactivos</h2>
          <div className="bg-white border border-gray-100 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Conductor</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Vehiculo</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staff.filter(s => !s.isActive).map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: member.color }} />
                        <span className="font-medium text-gray-700">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {member.vehicleModel} - {member.licensePlate}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {getEquipmentShortName(member.equipmentType)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
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

      {staff.length === 0 && (
        <div className="text-center py-8">
          <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No hay conductores registrados</p>
          <p className="text-xs text-gray-400">Agrega un conductor con su vehiculo asignado</p>
        </div>
      )}
    </div>
  )
}
