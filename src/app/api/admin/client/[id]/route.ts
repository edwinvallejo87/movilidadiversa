import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-auth'

const UpdateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional(),
  document: z.string().optional(),
  age: z.union([z.string(), z.number()]).optional().transform(val => val ? parseInt(String(val)) : null),
  weight: z.union([z.string(), z.number()]).optional().transform(val => val ? parseFloat(String(val)) : null),
  wheelchairType: z.string().optional(),
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
  const { error } = await requireAuth()
  if (error) return error

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
  const { error } = await requireAuth()
  if (error) return error

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

    // Map form fields to database fields
    const updateData: Record<string, unknown> = {}

    // Direct fields
    if (customerData.name !== undefined) updateData.name = customerData.name
    if (customerData.phone !== undefined) updateData.phone = customerData.phone
    if (customerData.document !== undefined) updateData.document = customerData.document || null
    if (customerData.age !== undefined) updateData.age = customerData.age
    if (customerData.weight !== undefined) updateData.weight = customerData.weight
    if (customerData.wheelchairType !== undefined) updateData.wheelchairType = customerData.wheelchairType || null
    if (customerData.emergencyContact !== undefined) updateData.emergencyContact = customerData.emergencyContact || null
    if (customerData.emergencyPhone !== undefined) updateData.emergencyPhone = customerData.emergencyPhone || null
    if (customerData.requiresAssistant !== undefined) updateData.requiresAssistant = customerData.requiresAssistant
    if (customerData.isActive !== undefined) updateData.isActive = customerData.isActive

    // Email - handle empty string as null
    if (customerData.email !== undefined) {
      updateData.email = customerData.email || null
    }

    // Mapped fields (form name -> db name)
    if (customerData.address !== undefined) {
      updateData.defaultAddress = customerData.address || null
    }
    if (customerData.medicalNeeds !== undefined) {
      updateData.medicalNotes = customerData.medicalNeeds || null
    }
    if (customerData.mobilityAid !== undefined) {
      updateData.mobilityNeeds = customerData.mobilityAid && customerData.mobilityAid !== 'NONE'
        ? JSON.stringify([customerData.mobilityAid])
        : null
    }

    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: updateData,
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
  const { error } = await requireAuth()
  if (error) return error

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