import { NextRequest, NextResponse } from 'next/server'

// Type definitions for Next.js 15+ route handlers
export interface RouteContext<T = {}> {
  params: Promise<T>
}

export type RouteHandler<T = {}> = (
  request: NextRequest,
  context: RouteContext<T>
) => Promise<NextResponse>

export interface IdParams {
  id: string
}