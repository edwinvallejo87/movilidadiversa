import { NextResponse } from 'next/server'
import { getSessionFromCookie, deleteSession, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getSessionFromCookie()

    if (session) {
      await deleteSession(session.token)
    }

    await clearSessionCookie()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    await clearSessionCookie()
    return NextResponse.json({ success: true })
  }
}
