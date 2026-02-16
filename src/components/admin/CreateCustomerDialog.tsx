'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CreateCustomerDialogProps {
  onCustomerCreated: (customer: { id: string; name: string; phone: string; document?: string | null; defaultAddress?: string | null; age?: number | null; weight?: number | null; wheelchairType?: string | null; emergencyContact?: string | null }) => void
  trigger?: React.ReactNode
}

const initialFormData = {
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
}

export function CreateCustomerDialog({ onCustomerCreated, trigger }: CreateCustomerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

  const resetForm = () => {
    setFormData(initialFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Nombre y teléfono son requeridos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear cliente')
      }

      const newCustomer = await response.json()

      toast.success('Cliente creado correctamente')

      onCustomerCreated({
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        document: newCustomer.document || null,
        defaultAddress: newCustomer.defaultAddress || null,
        age: newCustomer.age || null,
        weight: newCustomer.weight || null,
        wheelchairType: newCustomer.wheelchairType || null,
        emergencyContact: newCustomer.emergencyContact || null
      })

      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="sm">
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Nuevo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-w-lg max-h-[85vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.stopPropagation()}
        onInteractOutside={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">Crear Nuevo Cliente</DialogTitle>
          <DialogDescription className="text-xs">
            Completa la información del cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cc-name" className="text-xs">Nombre Completo *</Label>
              <Input
                id="cc-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez"
                required
                disabled={loading}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cc-phone" className="text-xs">Teléfono *</Label>
              <Input
                id="cc-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="300 123 4567"
                required
                disabled={loading}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cc-email" className="text-xs">Email</Label>
              <Input
                id="cc-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                disabled={loading}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cc-document" className="text-xs">Cédula / Documento</Label>
              <Input
                id="cc-document"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                placeholder="CC/NIT"
                disabled={loading}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Physical info */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="cc-age" className="text-xs">Edad</Label>
              <Input
                id="cc-age"
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
              <Label htmlFor="cc-weight" className="text-xs">Peso (kg)</Label>
              <Input
                id="cc-weight"
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
            <div>
              <Label htmlFor="cc-wheelchairType" className="text-xs">Tipo de Silla</Label>
              <Select
                value={formData.wheelchairType}
                onValueChange={(value) => setFormData({ ...formData, wheelchairType: value })}
                disabled={loading}
              >
                <SelectTrigger className="h-8 text-sm">
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
            <Label htmlFor="cc-address" className="text-xs">Dirección</Label>
            <Input
              id="cc-address"
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
              <Label htmlFor="cc-mobilityAid" className="text-xs">Ayuda de Movilidad</Label>
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
                id="cc-assistant"
                checked={formData.requiresAssistant}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresAssistant: checked })
                }
                disabled={loading}
              />
              <Label htmlFor="cc-assistant" className="text-xs">
                Requiere asistente
              </Label>
            </div>
          </div>

          {/* Emergency contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="cc-emergencyContact" className="text-xs">Contacto Emergencia</Label>
              <Input
                id="cc-emergencyContact"
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
              <Label htmlFor="cc-emergencyPhone" className="text-xs">Tel. Emergencia</Label>
              <Input
                id="cc-emergencyPhone"
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

          {/* Notes */}
          <div>
            <Label htmlFor="cc-notes" className="text-xs">Notas</Label>
            <Textarea
              id="cc-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones especiales..."
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
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
