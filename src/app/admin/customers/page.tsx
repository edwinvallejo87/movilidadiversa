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
import { PlusCircle, Edit, Trash2, Search, User, Phone, Mail, Accessibility, PersonStanding, Activity, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/admin'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  email?: string
  phone: string
  document?: string
  age?: number
  weight?: number
  wheelchairType?: string
  defaultAddress?: string
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

const ITEMS_PER_PAGE = 20

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    age: '',
    weight: '',
    wheelchairType: '',
    address: '',
    medicalNeeds: '',
    mobilityAid: 'NONE' as 'WHEELCHAIR' | 'WALKER' | 'CRUTCHES' | 'NONE',
    requiresAssistant: false,
    emergencyContact: '',
    emergencyPhone: '',
    notes: '',
    isActive: true
  })

  const fetchCustomers = async (search?: string, page: number = 1) => {
    try {
      const searchParams = new URLSearchParams()
      if (search) searchParams.set('search', search)
      searchParams.set('limit', ITEMS_PER_PAGE.toString())
      searchParams.set('offset', ((page - 1) * ITEMS_PER_PAGE).toString())

      const response = await fetch(`/api/admin/clients?${searchParams}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()

      // Handle both formats: { customers, total } or array
      if (data.customers) {
        setCustomers(data.customers)
        setTotalCount(data.total || data.customers.length)
      } else if (Array.isArray(data)) {
        setCustomers(data)
        setTotalCount(data.length)
      } else {
        setCustomers([])
        setTotalCount(0)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Error al cargar los clientes')
      setCustomers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(searchTerm, currentPage)
  }, [currentPage])

  const handleSearch = () => {
    setCurrentPage(1)
    setLoading(true)
    fetchCustomers(searchTerm, 1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setLoading(true)
      setCurrentPage(newPage)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      document: '',
      age: '',
      weight: '',
      wheelchairType: '',
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
        const response = await fetch(`/api/admin/client/${editingCustomer.id}`, {
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
        const response = await fetch('/api/admin/clients', {
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
      fetchCustomers(searchTerm, currentPage)
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
      age: customer.age?.toString() || '',
      weight: customer.weight?.toString() || '',
      wheelchairType: customer.wheelchairType || '',
      address: customer.defaultAddress || '',
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
      const response = await fetch(`/api/admin/client/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      toast.success('Cliente desactivado correctamente')
      fetchCustomers(searchTerm, currentPage)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al desactivar')
    }
  }

  const getMobilityAidIcon = (aid: string) => {
    switch (aid) {
      case 'WHEELCHAIR': return <Accessibility className="w-4 h-4 text-blue-600" />
      case 'WALKER': return <PersonStanding className="w-4 h-4 text-orange-600" />
      case 'CRUTCHES': return <Activity className="w-4 h-4 text-purple-600" />
      default: return null
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

  if (loading && customers.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div>
      <PageHeader
        title="Gestion de Clientes"
        description={`${totalCount} clientes en total`}
      />

      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open)
          if (!open) {
            setEditingCustomer(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Cliente
            </Button>
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

              {/* Información física */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Edad</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    placeholder="Años"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    placeholder="Kg"
                  />
                </div>
                <div>
                  <Label htmlFor="wheelchairType">Tipo de Silla</Label>
                  <Select
                    value={formData.wheelchairType}
                    onValueChange={(value) => setFormData({...formData, wheelchairType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL_PLEGABLE">Manual plegable</SelectItem>
                      <SelectItem value="MANUAL_RIGIDA">Manual rígida</SelectItem>
                      <SelectItem value="ELECTRICA">Eléctrica / Motorizada</SelectItem>
                      <SelectItem value="TRANSPORTE">De traslado (liviana)</SelectItem>
                      <SelectItem value="BARIATRICA">Bariátrica</SelectItem>
                      <SelectItem value="NEUROLOGICA">Neurológica / Postural</SelectItem>
                      <SelectItem value="NO_TIENE">No tiene (requiere silla)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Dirección predeterminada"
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCustomer ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border border-gray-100 rounded p-3 mb-4">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Buscar por nombre, email, telefono o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button size="sm" onClick={handleSearch}>
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Contacto</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Edad/Peso</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Dirección</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Citas</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2 font-medium text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-gray-400" />
                      <div>
                        <div>{customer.name}</div>
                        {customer.document && (
                          <div className="text-[10px] text-gray-400">{customer.document}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-0.5 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    <div className="space-y-0.5">
                      {customer.age && <div>{customer.age} años</div>}
                      {customer.weight && <div>{customer.weight} kg</div>}
                      {!customer.age && !customer.weight && <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {customer.defaultAddress ? (
                      <div className="text-gray-600 max-w-[200px] truncate" title={customer.defaultAddress}>
                        {customer.defaultAddress}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">
                      {customer._count.appointments}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {customer.isActive ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">Activo</span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">Inactivo</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                        disabled={!customer.isActive}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {customers.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No se encontraron clientes</p>
        </div>
      )}
    </div>
  )
}
