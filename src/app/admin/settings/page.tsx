'use client'

import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PlusCircle, Pencil, Trash2, User, Shield, ShieldCheck, Check, X } from 'lucide-react'

interface UserType {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

const initialFormData = {
  email: '',
  password: '',
  name: '',
  role: 'ADMIN',
  isActive: true
}

// Password validation (mirrors backend)
function validatePassword(password: string) {
  const checks = {
    minLength: password.length >= 8,
    maxLength: password.length <= 128,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }

  const isValid = Object.values(checks).every(Boolean)

  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  const passedChecks = Object.values(checks).filter(Boolean).length
  if (passedChecks >= 6) strength = 'strong'
  else if (passedChecks >= 4) strength = 'medium'

  return { checks, isValid, strength }
}

export default function SettingsPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  const passwordValidation = useMemo(
    () => validatePassword(formData.password),
    [formData.password]
  )

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/auth/users')
      if (!response.ok) throw new Error('Error al cargar usuarios')
      const data = await response.json()
      setUsers(data.users)
    } catch {
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData(initialFormData)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (user: UserType) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      isActive: user.isActive
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.name) {
      toast.error('Email y nombre son requeridos')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('La contraseña es requerida para nuevos usuarios')
      return
    }

    // Validate password on create or if provided on edit
    if (formData.password && !passwordValidation.isValid) {
      toast.error('La contraseña no cumple con los requisitos de seguridad')
      return
    }

    setSubmitting(true)

    try {
      const url = editingUser
        ? `/api/auth/users/${editingUser.id}`
        : '/api/auth/users'

      const body = editingUser
        ? {
            email: formData.email,
            name: formData.name,
            role: formData.role,
            isActive: formData.isActive,
            ...(formData.password ? { password: formData.password } : {})
          }
        : formData

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar usuario')
      }

      toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado')
      setIsDialogOpen(false)
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user: UserType) => {
    if (!confirm(`¿Estás seguro de eliminar a ${user.name}?`)) return

    try {
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar usuario')
      }

      toast.success('Usuario eliminado')
      fetchUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-1.5 text-[10px] ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {text}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Gestiona los usuarios del sistema"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
                </DialogTitle>
                <DialogDescription>
                  {editingUser
                    ? 'Modifica los datos del usuario. Deja la contraseña vacía para mantener la actual.'
                    : 'Completa los datos para crear un nuevo usuario administrador.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nombre completo"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="correo@ejemplo.com"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="password">
                    Contraseña {editingUser ? '(dejar vacía para no cambiar)' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={editingUser ? '••••••••' : 'Contraseña segura'}
                    required={!editingUser}
                    disabled={submitting}
                  />

                  {/* Password requirements */}
                  {(formData.password || !editingUser) && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-md space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-gray-500">Requisitos:</span>
                        {formData.password && (
                          <Badge
                            variant={
                              passwordValidation.strength === 'strong'
                                ? 'default'
                                : passwordValidation.strength === 'medium'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={`text-[9px] px-1.5 py-0 ${
                              passwordValidation.strength === 'strong'
                                ? 'bg-green-500'
                                : passwordValidation.strength === 'medium'
                                ? 'bg-yellow-500 text-black'
                                : ''
                            }`}
                          >
                            {passwordValidation.strength === 'strong'
                              ? 'Fuerte'
                              : passwordValidation.strength === 'medium'
                              ? 'Media'
                              : 'Débil'}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2">
                        <PasswordRequirement
                          met={passwordValidation.checks.minLength}
                          text="Mínimo 8 caracteres"
                        />
                        <PasswordRequirement
                          met={passwordValidation.checks.hasUppercase}
                          text="Una mayúscula"
                        />
                        <PasswordRequirement
                          met={passwordValidation.checks.hasLowercase}
                          text="Una minúscula"
                        />
                        <PasswordRequirement
                          met={passwordValidation.checks.hasNumber}
                          text="Un número"
                        />
                        <PasswordRequirement
                          met={passwordValidation.checks.hasSpecial}
                          text="Un carácter especial"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingUser && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked })
                      }
                      disabled={submitting}
                    />
                    <Label htmlFor="isActive">Usuario activo</Label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || (!editingUser && !passwordValidation.isValid)}
                  >
                    {submitting
                      ? 'Guardando...'
                      : editingUser
                      ? 'Actualizar'
                      : 'Crear Usuario'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Users table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            Usuarios del Sistema
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay usuarios</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    {user.role === 'SUPER_ADMIN' ? (
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Shield className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {user.name}
                      </span>
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                      {user.role === 'SUPER_ADMIN' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-600">
                          Super Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-[10px] text-gray-400">
                      Último acceso: {formatDate(user.lastLoginAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(user)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
