import { NextResponse } from 'next/server'
import { getCurrentUser } from './auth'

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
  }

  return { user, error: null }
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
  }

  if (user.role !== 'SUPER_ADMIN') {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 }
      )
    }
  }

  return { user, error: null }
}
