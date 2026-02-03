import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

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
    const {
      name,
      email,
      phone,
      type,
      status,
      color,
      licensePlate,
      vehicleModel,
      capacity,
      isWheelchairAccessible,
      equipmentType,
      licenseNumber,
      workDays,
      workStartTime,
      workEndTime,
      isActive
    } = body

    const staff = await prisma.staff.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        type: type || 'DRIVER',
        status: status || 'AVAILABLE',
        color: color || '#3B82F6',
        licensePlate: licensePlate || null,
        vehicleModel: vehicleModel || null,
        capacity: capacity || null,
        isWheelchairAccessible: isWheelchairAccessible ?? false,
        equipmentType: equipmentType || 'RAMPA',
        licenseNumber: licenseNumber || null,
        workDays: workDays || '1,2,3,4,5',
        workStartTime: workStartTime || '07:00',
        workEndTime: workEndTime || '19:00',
        isActive: isActive ?? true
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
