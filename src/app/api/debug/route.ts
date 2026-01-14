import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'present' : 'missing'
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { 
        error: 'Debug API failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}