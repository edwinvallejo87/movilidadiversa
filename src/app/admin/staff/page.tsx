'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
// Removed Table imports - using standard HTML table with pro-table classes
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle, Edit, Trash2, Car, User, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

interface Staff {
  id: string
  name: string
  type: 'DRIVER' | 'VEHICLE' | 'ASSISTANT'
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE'
  phone?: string
  email?: string
  licensePlate?: string
  capacity?: number
  isWheelchairAccessible: boolean
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

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'DRIVER' as 'DRIVER' | 'VEHICLE' | 'ASSISTANT',
    status: 'AVAILABLE' as 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE',
    phone: '',
    email: '',
    licensePlate: '',
    capacity: '',
    isWheelchairAccessible: false,
    licenseNumber: '',
    workDays: '1,2,3,4,5',
    workStartTime: '07:00',
    workEndTime: '19:00',
    isActive: true
  })

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/staff')
      const data = await response.json()
      setStaff(data)
    } catch (error) {
      toast.error('Error al cargar el staff')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'DRIVER',
      status: 'AVAILABLE',
      phone: '',
      email: '',
      licensePlate: '',
      capacity: '',
      isWheelchairAccessible: false,
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
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined
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

        toast.success('Staff actualizado correctamente')
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

        toast.success('Staff creado correctamente')
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
      type: staffMember.type,
      status: staffMember.status,
      phone: staffMember.phone || '',
      email: staffMember.email || '',
      licensePlate: staffMember.licensePlate || '',
      capacity: staffMember.capacity?.toString() || '',
      isWheelchairAccessible: staffMember.isWheelchairAccessible,
      licenseNumber: staffMember.licenseNumber || '',
      workDays: staffMember.workDays,
      workStartTime: staffMember.workStartTime,
      workEndTime: staffMember.workEndTime,
      isActive: staffMember.isActive
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este miembro del staff?')) return

    try {
      const response = await fetch(`/api/admin/staff/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('Staff desactivado correctamente')
      fetchStaff()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al desactivar')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VEHICLE': return <Car className="h-4 w-4" />
      case 'DRIVER': return <User className="h-4 w-4" />
      case 'ASSISTANT': return <UserCheck className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-800'
      case 'BUSY': return 'bg-yellow-100 text-yellow-800'
      case 'OFFLINE': return 'bg-gray-100 text-gray-800'
      case 'MAINTENANCE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const workDaysMap = {
    '1': 'Lun',
    '2': 'Mar', 
    '3': 'Mié',
    '4': 'Jue',
    '5': 'Vie',
    '6': 'Sáb',
    '7': 'Dom'
  }

  const formatWorkDays = (days: string) => {
    return days.split(',').map(d => workDaysMap[d as keyof typeof workDaysMap]).join(', ')
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Gestión de Staff</h1>
        <p className="page-subtitle">Administra vehículos, conductores y asistentes</p>
      </div>

      <div className="flex justify-end mb-6">
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingStaff(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <button className="pro-btn pro-btn-primary">
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Staff
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? 'Editar' : 'Agregar'} Miembro del Staff
              </DialogTitle>
              <DialogDescription>
                Completa la información del miembro del staff
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRIVER">Conductor</SelectItem>
                      <SelectItem value="VEHICLE">Vehículo</SelectItem>
                      <SelectItem value="ASSISTANT">Asistente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {formData.type === 'VEHICLE' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licensePlate">Placa</Label>
                      <Input
                        id="licensePlate"
                        value={formData.licensePlate}
                        onChange={(e) => setFormData({...formData, licensePlate: e.target.value})}
                        required={formData.type === 'VEHICLE'}
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacidad</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="wheelchair"
                      checked={formData.isWheelchairAccessible}
                      onCheckedChange={(checked) => setFormData({...formData, isWheelchairAccessible: checked})}
                    />
                    <Label htmlFor="wheelchair">Accesible para silla de ruedas</Label>
                  </div>
                </>
              )}

              {formData.type === 'DRIVER' && (
                <div>
                  <Label htmlFor="licenseNumber">Número de Licencia</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                    required={formData.type === 'DRIVER'}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workStartTime">Hora de Inicio</Label>
                  <Input
                    id="workStartTime"
                    type="time"
                    value={formData.workStartTime}
                    onChange={(e) => setFormData({...formData, workStartTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="workEndTime">Hora de Fin</Label>
                  <Input
                    id="workEndTime"
                    type="time"
                    value={formData.workEndTime}
                    onChange={(e) => setFormData({...formData, workEndTime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="workDays">Días de Trabajo</Label>
                <Input
                  id="workDays"
                  value={formData.workDays}
                  onChange={(e) => setFormData({...formData, workDays: e.target.value})}
                  placeholder="1,2,3,4,5 (Lun-Vie)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Usar números: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 7=Dom
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="active">Activo</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingStaff ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="pro-card overflow-hidden">
        <div className="p-0">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Contacto</th>
                <th>Detalles</th>
                <th>Horario</th>
                <th>Citas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="font-medium">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(member.type)}
                      <span>{member.name}</span>
                      {!member.isActive && (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge variant="outline">
                      {member.type === 'DRIVER' ? 'Conductor' : 
                       member.type === 'VEHICLE' ? 'Vehículo' : 'Asistente'}
                    </Badge>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      member.status === 'AVAILABLE' ? 'status-available' :
                      member.status === 'BUSY' ? 'status-busy' :
                      member.status === 'OFFLINE' ? 'status-offline' : 'status-maintenance'
                    }`}>
                      {member.status === 'AVAILABLE' ? 'Disponible' :
                       member.status === 'BUSY' ? 'Ocupado' :
                       member.status === 'OFFLINE' ? 'Desconectado' : 'Mantenimiento'}
                    </span>
                  </td>
                  <td>
                    <div className="space-y-1 text-sm">
                      {member.phone && <div>📞 {member.phone}</div>}
                      {member.email && <div>✉️ {member.email}</div>}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1 text-sm">
                      {member.licensePlate && <div>🚗 {member.licensePlate}</div>}
                      {member.licenseNumber && <div>🆔 {member.licenseNumber}</div>}
                      {member.capacity && <div>👥 {member.capacity} personas</div>}
                      {member.isWheelchairAccessible && <div>♿ Accesible</div>}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div>{formatWorkDays(member.workDays)}</div>
                      <div>{member.workStartTime} - {member.workEndTime}</div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">
                      <div>{member._count.appointments} citas</div>
                      <div>{member._count.unavailability} indisponibilidades</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(member.id)}
                        disabled={!member.isActive}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}