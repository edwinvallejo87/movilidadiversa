import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const UpdateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  medicalNeeds: z.string().optional(),
  mobilityAid: z.enum(['WHEELCHAIR', 'WALKER', 'CRUTCHES', 'NONE']).optional(),
  requiresAssistant: z.boolean().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional()
})

// GET handler for fetching a customer by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await context.params
    const customerId = resolvedParams.id
    
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            service: true,
            staff: true
          }
        },
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Error fetching customer' },
      { status: 500 }
    )
  }
}

// PUT handler for updating a customer
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await context.params
    const customerId = resolvedParams.id
    
    const body = await request.json()
    const customerData = UpdateCustomerSchema.parse(body)

    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (customerData.email && customerData.email !== existingCustomer.email) {
      const duplicateCustomer = await db.customer.findFirst({
        where: { 
          email: customerData.email,
          isActive: true,
          id: { not: customerId }
        }
      })
      
      if (duplicateCustomer) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 409 }
        )
      }
    }

    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: customerData,
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('Error updating customer:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error updating customer' },
      { status: 500 }
    )
  }
}

// DELETE handler for deactivating a customer
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const resolvedParams = await context.params
    const customerId = resolvedParams.id
    
    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: {
            appointments: true
          }
        }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const activeAppointments = await db.appointment.count({
      where: {
        customerId: customerId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    })

    if (activeAppointments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with active appointments' },
        { status: 409 }
      )
    }

    await db.customer.update({
      where: { id: customerId },
      data: { 
        isActive: false
      }
    })

    return NextResponse.json({ message: 'Customer deactivated successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Error deleting customer' },
      { status: 500 }
    )
  }
}