import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    let startDate: Date
    let endDate: Date

    if (dateParam) {
      // Single day view
      startDate = new Date(dateParam)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    } else if (startDateParam && endDateParam) {
      // Date range view
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      // Default to today
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    }

    // Get all active staff
    const staff = await db.staff.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        workStartTime: true,
        workEndTime: true
      },
      orderBy: { name: 'asc' }
    })

    // Get appointments for the date range
    const appointments = await db.appointment.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lt: endDate
        },
        status: { notIn: ['CANCELLED'] }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            color: true,
            durationMinutes: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        resource: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    })

    // Get all resources
    const resources = await db.resource.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        type: true,
        color: true,
        capacity: true
      },
      orderBy: { name: 'asc' }
    })

    // Group appointments by staff
    const staffWithAppointments = staff.map(staffMember => ({
      id: staffMember.id,
      name: staffMember.name,
      type: staffMember.type,
      color: staffMember.color,
      workStartTime: staffMember.workStartTime,
      workEndTime: staffMember.workEndTime,
      appointments: appointments
        .filter(apt => apt.staffId === staffMember.id)
        .map(apt => ({
          id: apt.id,
          startDateTime: apt.scheduledAt,
          endDateTime: new Date(apt.scheduledAt.getTime() + ((apt.service?.durationMinutes || apt.estimatedDuration || 60) * 60000)),
          customer: apt.customer,
          service: apt.service,
          resource: apt.resource,
          status: apt.status,
          originAddress: apt.originAddress,
          destinationAddress: apt.destinationAddress,
          totalAmount: apt.totalAmount,
          notes: apt.notes
        }))
    }))

    // Group appointments by resource
    const resourcesWithAppointments = resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      color: resource.color,
      capacity: resource.capacity,
      appointments: appointments
        .filter(apt => apt.resourceId === resource.id)
        .map(apt => ({
          id: apt.id,
          startDateTime: apt.scheduledAt,
          endDateTime: new Date(apt.scheduledAt.getTime() + ((apt.service?.durationMinutes || apt.estimatedDuration || 60) * 60000)),
          customer: apt.customer,
          service: apt.service,
          staff: apt.staff,
          status: apt.status,
          originAddress: apt.originAddress,
          destinationAddress: apt.destinationAddress,
          totalAmount: apt.totalAmount,
          notes: apt.notes
        }))
    }))

    // Also include unassigned appointments
    const unassignedAppointments = appointments
      .filter(apt => !apt.staffId)
      .map(apt => ({
        id: apt.id,
        startDateTime: apt.scheduledAt,
        endDateTime: new Date(apt.scheduledAt.getTime() + ((apt.service?.durationMinutes || apt.estimatedDuration || 60) * 60000)),
        customer: apt.customer,
        service: apt.service,
        resource: apt.resource,
        status: apt.status,
        originAddress: apt.originAddress,
        destinationAddress: apt.destinationAddress,
        totalAmount: apt.totalAmount,
        notes: apt.notes
      }))

    return NextResponse.json({
      date: dateParam || startDateParam,
      startDate: startDateParam,
      endDate: endDateParam,
      staff: staffWithAppointments,
      resources: resourcesWithAppointments,
      unassignedAppointments
    })

  } catch (error) {
    console.error('Error fetching calendar appointments:', error)
    return NextResponse.json(
      { error: 'Error fetching calendar appointments' },
      { status: 500 }
    )
  }
}