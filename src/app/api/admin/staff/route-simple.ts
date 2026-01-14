import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test simple query first
    const staff = await db.staff.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        isActive: true
      }
    })

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Staff API error:', error)
    return NextResponse.json(
      { 
        error: 'Error fetching staff',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}