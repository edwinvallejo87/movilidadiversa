import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      )
    }

    const customers = await db.customer.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        defaultAddress: true,
        _count: {
          select: { appointments: true }
        }
      },
      orderBy: [
        { name: 'asc' }
      ],
      take: 10
    })

    return NextResponse.json(customers)

  } catch (error) {
    console.error('Error searching customers:', error)
    return NextResponse.json(
      { error: 'Error searching customers' },
      { status: 500 }
    )
  }
}