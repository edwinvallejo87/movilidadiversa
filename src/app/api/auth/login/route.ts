import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createSession, setSessionCookie } from '@/lib/auth'

// Simple in-memory rate limiting (for production, use Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>()

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

function getClientIdentifier(request: NextRequest, email: string): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'
  return `${ip}:${email.toLowerCase()}`
}

function checkRateLimit(identifier: string): { blocked: boolean; remainingTime?: number } {
  const now = Date.now()
  const record = loginAttempts.get(identifier)

  if (!record) {
    return { blocked: false }
  }

  // Check if blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const remainingTime = Math.ceil((record.blockedUntil - now) / 1000 / 60)
    return { blocked: true, remainingTime }
  }

  // Reset if outside window
  if (now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.delete(identifier)
    return { blocked: false }
  }

  return { blocked: false }
}

function recordFailedAttempt(identifier: string): { blocked: boolean; remainingAttempts: number } {
  const now = Date.now()
  const record = loginAttempts.get(identifier)

  if (!record || now - record.lastAttempt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 }
  }

  const newCount = record.count + 1

  if (newCount >= MAX_ATTEMPTS) {
    loginAttempts.set(identifier, {
      count: newCount,
      lastAttempt: now,
      blockedUntil: now + BLOCK_DURATION_MS
    })
    return { blocked: true, remainingAttempts: 0 }
  }

  loginAttempts.set(identifier, { count: newCount, lastAttempt: now })
  return { blocked: false, remainingAttempts: MAX_ATTEMPTS - newCount }
}

function clearAttempts(identifier: string) {
  loginAttempts.delete(identifier)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const identifier = getClientIdentifier(request, email)

    // Check if blocked
    const rateCheck = checkRateLimit(identifier)
    if (rateCheck.blocked) {
      return NextResponse.json(
        { error: `Demasiados intentos fallidos. Intenta de nuevo en ${rateCheck.remainingTime} minutos.` },
        { status: 429 }
      )
    }

    const user = await authenticateUser(email, password)

    if (!user) {
      const result = recordFailedAttempt(identifier)

      if (result.blocked) {
        return NextResponse.json(
          { error: 'Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `Credenciales inválidas. ${result.remainingAttempts} intentos restantes.` },
        { status: 401 }
      )
    }

    // Clear attempts on successful login
    clearAttempts(identifier)

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
