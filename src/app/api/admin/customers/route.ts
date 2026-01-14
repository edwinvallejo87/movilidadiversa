import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  document: z.string().optional(),
  defaultAddress: z.string().optional(),
  medicalNotes: z.string().optional(),
  mobilityNeeds: z.string().optional(),
  emergencyContact: z.string().optional(),
  preferredLanguage: z.string().default("es"),
  isActive: z.boolean().default(true)
})

const UpdateCustomerSchema = CreateCustomerSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      isActive: true
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } }
      ]
    }

    const customers = await db.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await db.customer.count({ where })

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Error fetching customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const customerData = CreateCustomerSchema.parse(body)

    if (customerData.email) {
      const existingCustomer = await db.customer.findFirst({
        where: { 
          email: customerData.email,
          isActive: true
        }
      })
      
      if (existingCustomer) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 409 }
        )
      }
    }

    const customer = await db.customer.create({
      data: customerData,
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating customer' },
      { status: 500 }
    )
  }
}