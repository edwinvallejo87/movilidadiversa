import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ resources: [] })
}

export async function POST() {
  return NextResponse.json({ message: 'Resource creation not available in temp mode' })
}