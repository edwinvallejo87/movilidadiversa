import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CreateStaffSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['DRIVER', 'VEHICLE', 'ASSISTANT']),
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE']).default('AVAILABLE'),
  phone: z.string().transform(val => val === '' ? undefined : val).optional(),
  email: z.string().transform(val => val === '' ? undefined : val).pipe(z.string().email()).optional(),
  licensePlate: z.string().transform(val => val === '' ? undefined : val).optional(),
  capacity: z.number().int().min(1).optional(),
  isWheelchairAccessible: z.boolean().default(false),
  licenseNumber: z.string().transform(val => val === '' ? undefined : val).optional(),
  workDays: z.string().default('1,2,3,4,5'),
  workStartTime: z.string().default('07:00'),
  workEndTime: z.string().default('19:00'),
  isActive: z.boolean().default(true)
})

const UpdateStaffSchema = CreateStaffSchema.partial()

export async function GET() {
  try {
    const staff = await db.staff.findMany({
      include: {
        _count: {
          select: {
            appointments: true,
            unavailability: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: 'Error fetching staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const staffData = CreateStaffSchema.parse(body)

    // Validación específica por tipo
    if (staffData.type === 'VEHICLE' && !staffData.licensePlate) {
      return NextResponse.json(
        { error: 'License plate is required for vehicles' },
        { status: 400 }
      )
    }

    if (staffData.type === 'DRIVER' && !staffData.licenseNumber) {
      return NextResponse.json(
        { error: 'License number is required for drivers' },
        { status: 400 }
      )
    }

    // Verificar que no exista una placa duplicada
    if (staffData.licensePlate) {
      const existingVehicle = await db.staff.findFirst({
        where: { 
          licensePlate: staffData.licensePlate,
          type: 'VEHICLE'
        }
      })
      
      if (existingVehicle) {
        return NextResponse.json(
          { error: 'Vehicle with this license plate already exists' },
          { status: 409 }
        )
      }
    }

    const staff = await db.staff.create({
      data: staffData,
      include: {
        _count: {
          select: {
            appointments: true,
            unavailability: true
          }
        }
      }
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating staff member' },
      { status: 500 }
    )
  }
}