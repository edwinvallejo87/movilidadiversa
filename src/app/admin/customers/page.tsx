'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle, Edit, Trash2, Search, User, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  email?: string
  phone: string
  document?: string
  address?: string
  medicalNeeds?: string
  mobilityAid: 'WHEELCHAIR' | 'WALKER' | 'CRUTCHES' | 'NONE'
  requiresAssistant: boolean
  emergencyContact?: string
  emergencyPhone?: string
  notes?: string
  isActive: boolean
  _count: {
    appointments: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    medicalNeeds: '',
    mobilityAid: 'NONE' as 'WHEELCHAIR' | 'WALKER' | 'CRUTCHES' | 'NONE',
    requiresAssistant: false,
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    isActive: true
  })

  const fetchCustomers = async (search?: string) => {
    try {
      const searchParams = new URLSearchParams()
      if (search) searchParams.set('search', search)
      
      const response = await fetch(`/api/admin/customers?${searchParams}`)
      const data = await response.json()
      setCustomers(data.customers)
    } catch (error) {
      toast.error('Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSearch = () => {
    setLoading(true)
    fetchCustomers(searchTerm)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
      address: '',
      medicalNeeds: '',
      mobilityAid: 'NONE',
      requiresAssistant: false,
      emergencyContact: '',
      emergencyPhone: '',
      notes: '',
      isActive: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCustomer) {
        const response = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Cliente actualizado correctamente')
      } else {
        const response = await fetch('/api/admin/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error)
        }

        toast.success('Cliente creado correctamente')
      }

      setIsCreateDialogOpen(false)
      setEditingCustomer(null)
      resetForm()
      fetchCustomers(searchTerm)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone,
      document: customer.document || '',
      address: customer.address || '',
      medicalNeeds: customer.medicalNeeds || '',
      mobilityAid: customer.mobilityAid,
      requiresAssistant: customer.requiresAssistant,
      emergencyContact: customer.emergencyContact || '',
      emergencyPhone: customer.emergencyPhone || '',
      notes: customer.notes || '',
      isActive: customer.isActive
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este cliente?')) return

    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('Cliente desactivado correctamente')
      fetchCustomers(searchTerm)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al desactivar')
    }
  }

  const getMobilityAidIcon = (aid: string) => {
    switch (aid) {
      case 'WHEELCHAIR': return '♿'
      case 'WALKER': return '🚶‍♂️'
      case 'CRUTCHES': return '🩹'
      default: return ''
    }
  }

  const getMobilityAidLabel = (aid: string) => {
    switch (aid) {
      case 'WHEELCHAIR': return 'Silla de ruedas'
      case 'WALKER': return 'Andador'
      case 'CRUTCHES': return 'Muletas'
      case 'NONE': return 'Ninguno'
      default: return 'Ninguno'
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Gestión de Clientes</h1>
        <p className="page-subtitle">Administra la base de datos de clientes</p>
      </div>

      <div className="flex justify-end mb-6">
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingCustomer(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <button className="pro-btn pro-btn-primary">
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Cliente
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Editar' : 'Agregar'} Cliente
              </DialogTitle>
              <DialogDescription>
                Completa la información del cliente
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="document">Documento</Label>
                  <Input
                    id="document"
                    value={formData.document}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mobilityAid">Ayuda de Movilidad</Label>
                  <Select value={formData.mobilityAid} onValueChange={(value) => setFormData({...formData, mobilityAid: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Ninguna</SelectItem>
                      <SelectItem value="WHEELCHAIR">Silla de ruedas</SelectItem>
                      <SelectItem value="WALKER">Andador</SelectItem>
                      <SelectItem value="CRUTCHES">Muletas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    id="assistant"
                    checked={formData.requiresAssistant}
                    onCheckedChange={(checked) => setFormData({...formData, requiresAssistant: checked})}
                  />
                  <Label htmlFor="assistant">Requiere asistente</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="medicalNeeds">Necesidades Médicas</Label>
                <Textarea
                  id="medicalNeeds"
                  value={formData.medicalNeeds}
                  onChange={(e) => setFormData({...formData, medicalNeeds: e.target.value})}
                  placeholder="Condiciones médicas, alergias, medicamentos, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notas Adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Preferencias, observaciones especiales, etc."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="active">Cliente activo</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" className="pro-btn pro-btn-secondary" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="pro-btn pro-btn-primary">
                  {editingCustomer ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="pro-card mb-6">
        <div className="card-content">
          <div className="flex space-x-2">
            <input
              className="form-input flex-1"
              placeholder="Buscar por nombre, email, teléfono o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="pro-btn pro-btn-primary" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="pro-card overflow-hidden">
        <div className="p-0">
          <table className="pro-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Movilidad</th>
                <th>Necesidades</th>
                <th>Emergencia</th>
                <th>Citas</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-medium">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div>{customer.name}</div>
                        {customer.document && (
                          <div className="text-xs text-gray-500">{customer.document}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-1">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span>{getMobilityAidIcon(customer.mobilityAid)}</span>
                        <span className="text-sm">{getMobilityAidLabel(customer.mobilityAid)}</span>
                      </div>
                      {customer.requiresAssistant && (
                        <span className="status-badge status-busy text-xs">
                          Requiere asistente
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {customer.medicalNeeds ? (
                      <div className="text-sm max-w-xs truncate" title={customer.medicalNeeds}>
                        {customer.medicalNeeds}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin necesidades especiales</span>
                    )}
                  </td>
                  <td>
                    {customer.emergencyContact ? (
                      <div className="text-sm">
                        <div>{customer.emergencyContact}</div>
                        {customer.emergencyPhone && (
                          <div className="text-xs text-gray-500">{customer.emergencyPhone}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No registrado</span>
                    )}
                  </td>
                  <td>
                    <span className="status-badge status-available">
                      {customer._count.appointments} citas
                    </span>
                  </td>
                  <td>
                    {customer.isActive ? (
                      <span className="status-badge status-available">Activo</span>
                    ) : (
                      <span className="status-badge status-offline">Inactivo</span>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        className="pro-btn pro-btn-secondary px-2 py-1"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="pro-btn pro-btn-secondary px-2 py-1"
                        onClick={() => handleDelete(customer.id)}
                        disabled={!customer.isActive}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {customers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}
    </div>
  )
}