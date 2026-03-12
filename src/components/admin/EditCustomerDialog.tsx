'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface EditCustomerDialogProps {
  customerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCustomerUpdated?: (customer: { id: string; name: string; phone: string }) => void
}

const initialFormData = {
  name: '',
  email: '',
  phone: '',
  document: '',
  age: '',
  weight: '',
  address: '',
  medicalNeeds: '',
  mobilityAid: 'NONE' as 'WHEELCHAIR' | 'WALKER' | 'CRUTCHES' | 'NONE',
  requiresAssistant: false,
  emergencyContact: '',
  emergencyPhone: '',
  notes: '',
  isActive: true,
}

export function EditCustomerDialog({
  customerId,
  open,
  onOpenChange,
  onCustomerUpdated,
}: EditCustomerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

  useEffect(() => {
    if (open && customerId) {
      fetchCustomer(customerId)
    }
    if (!open) {
      setFormData(initialFormData)
    }
  }, [open, customerId])

  const fetchCustomer = async (id: string) => {
    setFetching(true)
    try {
      const response = await fetch(`/api/admin/client/${id}`)
      if (!response.ok) throw new Error('Error al cargar cliente')
      const customer = await response.json()

      // Parse mobilityNeeds JSON to mobilityAid enum
      let mobilityAid: typeof formData.mobilityAid = 'NONE'
      if (customer.mobilityNeeds) {
        try {
          const parsed = JSON.parse(customer.mobilityNeeds)
          if (Array.isArray(parsed) && parsed.length > 0) {
            mobilityAid = parsed[0] as typeof mobilityAid
          }
        } catch {
          // If it's not JSON, try direct value
          if (['WHEELCHAIR', 'WALKER', 'CRUTCHES'].includes(customer.mobilityNeeds)) {
            mobilityAid = customer.mobilityNeeds as typeof mobilityAid
          }
        }
      }

      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        document: customer.document || '',
        age: customer.age?.toString() || '',
        weight: customer.weight?.toString() || '',
        address: customer.defaultAddress || '',
        medicalNeeds: customer.medicalNotes || '',
        mobilityAid,
        requiresAssistant: customer.requiresAssistant || false,
        emergencyContact: customer.emergencyContact || '',
        emergencyPhone: customer.emergencyPhone || '',
        notes: customer.wheelchairType || '',
        isActive: customer.isActive ?? true,
      })
    } catch (error) {
      toast.error('Error al cargar los datos del cliente')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!customerId) return

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Nombre y teléfono son requeridos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/client/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar cliente')
      }

      const updatedCustomer = await response.json()
      toast.success('Cliente actualizado correctamente')

      onCustomerUpdated?.({
        id: updatedCustomer.id,
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
      })

      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[85vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.stopPropagation()}
        onInteractOutside={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">Editar Cliente</DialogTitle>
          <DialogDescription className="text-xs">
            Actualiza la información del cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex justify-center items-center py-8 text-sm text-gray-500">
            Cargando datos del cliente...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Main fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ec-name" className="text-xs">Nombre Completo *</Label>
                <Input
                  id="ec-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ec-phone" className="text-xs">Teléfono *</Label>
                <Input
                  id="ec-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={loading}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ec-email" className="text-xs">Email</Label>
                <Input
                  id="ec-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ec-document" className="text-xs">Cédula / Documento</Label>
                <Input
                  id="ec-document"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  disabled={loading}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Physical info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ec-age" className="text-xs">Edad</Label>
                <Input
                  id="ec-age"
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Años"
                  disabled={loading}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ec-weight" className="text-xs">Peso (kg)</Label>
                <Input
                  id="ec-weight"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="Kg"
                  disabled={loading}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ec-address" className="text-xs">Dirección</Label>
              <Input
                id="ec-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección predeterminada"
                disabled={loading}
                className="h-8 text-sm"
              />
            </div>

            {/* Mobility */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ec-mobilityAid" className="text-xs">Ayuda de Movilidad</Label>
                <Select
                  value={formData.mobilityAid}
                  onValueChange={(value) =>
                    setFormData({ ...formData, mobilityAid: value as typeof formData.mobilityAid })
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="h-8 text-sm">
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
              <div className="flex items-center space-x-2 mt-5">
                <Switch
                  id="ec-assistant"
                  checked={formData.requiresAssistant}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, requiresAssistant: checked })
                  }
                  disabled={loading}
                />
                <Label htmlFor="ec-assistant" className="text-xs">
                  Requiere asistente
                </Label>
              </div>
            </div>

            {/* Emergency contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ec-emergencyContact" className="text-xs">Contacto Emergencia</Label>
                <Input
                  id="ec-emergencyContact"
                  value={formData.emergencyContact}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContact: e.target.value })
                  }
                  placeholder="Nombre del contacto"
                  disabled={loading}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="ec-emergencyPhone" className="text-xs">Tel. Emergencia</Label>
                <Input
                  id="ec-emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyPhone: e.target.value })
                  }
                  placeholder="300 000 0000"
                  disabled={loading}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Medical needs */}
            <div>
              <Label htmlFor="ec-medicalNeeds" className="text-xs">Necesidades Médicas</Label>
              <Textarea
                id="ec-medicalNeeds"
                value={formData.medicalNeeds}
                onChange={(e) => setFormData({ ...formData, medicalNeeds: e.target.value })}
                placeholder="Condiciones médicas, alergias, medicamentos..."
                rows={2}
                disabled={loading}
                className="text-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
