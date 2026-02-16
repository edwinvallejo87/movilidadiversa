import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

const CreateStaffSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  type: z.string().optional().default('DRIVER'),
  status: z.string().optional().default('AVAILABLE'),
  color: z.string().optional().default('#3B82F6'),
  licensePlate: z.string().optional().nullable(),
  vehicleModel: z.string().optional().nullable(),
  capacity: z.number().optional().nullable(),
  isWheelchairAccessible: z.boolean().optional().default(false),
  equipmentType: z.string().optional().default('RAMPA'),
  licenseNumber: z.string().optional().nullable(),
  workDays: z.string().optional().default('1,2,3,4,5'),
  workStartTime: z.string().optional().default('07:00'),
  workEndTime: z.string().optional().default('19:00'),
  isActive: z.boolean().optional().default(true),
})

export async function GET() {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { appointments: true, unavailability: true }
        }
      }
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Staff API error:', error)
    return NextResponse.json(
      { error: 'Error fetching staff' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = CreateStaffSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const data = parsed.data

    const staff = await prisma.staff.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        type: data.type,
        status: data.status,
        color: data.color,
        licensePlate: data.licensePlate || null,
        vehicleModel: data.vehicleModel || null,
        capacity: data.capacity || null,
        isWheelchairAccessible: data.isWheelchairAccessible,
        equipmentType: data.equipmentType,
        licenseNumber: data.licenseNumber || null,
        workDays: data.workDays,
        workStartTime: data.workStartTime,
        workEndTime: data.workEndTime,
        isActive: data.isActive,
      },
      include: {
        _count: {
          select: { appointments: true, unavailability: true }
        }
      }
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json(
      { error: 'Error creating staff' },
      { status: 500 }
    )
  }
}
