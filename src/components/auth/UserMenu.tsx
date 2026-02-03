'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { toast } from 'sonner'

interface UserMenuProps {
  user: {
    name: string
    email: string
    role: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Sesión cerrada')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Error al cerrar sesión')
    }
  }

  return (
    <div className="fixed top-4 right-4 z-30 flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-100 px-3 py-2 lg:top-2">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-600">{user.name}</span>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout} className="h-7 px-2">
        <LogOut className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}
