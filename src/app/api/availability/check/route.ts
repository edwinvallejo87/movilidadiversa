import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const CheckAvailabilitySchema = z.object({
  staffId: z.string().cuid().optional(),
  resourceId: z.string().cuid().optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  excludeAppointmentId: z.string().cuid().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filter out null and empty values before validation
    const rawQuery = {
      staffId: searchParams.get('staffId'),
      resourceId: searchParams.get('resourceId'),
      startDateTime: searchParams.get('startDateTime'),
      endDateTime: searchParams.get('endDateTime'),
      excludeAppointmentId: searchParams.get('excludeAppointmentId')
    }
    
    // Remove null/empty values
    const query = Object.fromEntries(
      Object.entries(rawQuery).filter(([_, v]) => v !== null && v !== '' && v !== 'null' && v !== 'undefined')
    )

    const validatedQuery = CheckAvailabilitySchema.parse(query)
    
    const startDateTime = new Date(validatedQuery.startDateTime)
    const endDateTime = new Date(validatedQuery.endDateTime)
    
    // Verificar disponibilidad del staff si se proporciona
    let staffAvailable = true
    let staffConflict = null
    
    if (validatedQuery.staffId) {
      const conflictingStaffAppointment = await db.appointment.findFirst({
        where: {
          staffId: validatedQuery.staffId,
          id: validatedQuery.excludeAppointmentId ? { not: validatedQuery.excludeAppointmentId } : undefined,
          status: { notIn: ['CANCELLED'] },
          OR: [
            // Appointment starts during the new one
            { 
              scheduledAt: { 
                gte: startDateTime, 
                lt: endDateTime 
              } 
            },
            // Appointment ends during the new one  
            { 
              scheduledAt: { lt: startDateTime },
              AND: {
                // Calculated end time overlaps
                scheduledAt: { 
                  gte: new Date(startDateTime.getTime() - (2 * 60 * 60 * 1000)) // 2 hours buffer
                }
              }
            }
          ]
        },
        include: { 
          customer: { select: { name: true } },
          service: { select: { name: true } }
        }
      })

      if (conflictingStaffAppointment) {
        staffAvailable = false
        staffConflict = conflictingStaffAppointment
      }
    }

    // Verificar disponibilidad del recurso si se proporciona
    let resourceAvailable = true
    let resourceConflict = null
    
    if (validatedQuery.resourceId) {
      const conflictingResourceAppointment = await db.appointment.findFirst({
        where: {
          resourceId: validatedQuery.resourceId,
          id: validatedQuery.excludeAppointmentId ? { not: validatedQuery.excludeAppointmentId } : undefined,
          status: { notIn: ['CANCELLED'] },
          OR: [
            { 
              scheduledAt: { 
                gte: startDateTime, 
                lt: endDateTime 
              } 
            },
            { 
              scheduledAt: { lt: startDateTime },
              AND: {
                scheduledAt: { 
                  gte: new Date(startDateTime.getTime() - (2 * 60 * 60 * 1000))
                }
              }
            }
          ]
        },
        include: { 
          customer: { select: { name: true } },
          service: { select: { name: true } }
        }
      })

      if (conflictingResourceAppointment) {
        resourceAvailable = false
        resourceConflict = conflictingResourceAppointment
      }
    }

    return NextResponse.json({
      available: staffAvailable && resourceAvailable,
      staff: {
        available: staffAvailable,
        conflictingAppointment: staffConflict
      },
      resource: {
        available: resourceAvailable,
        conflictingAppointment: resourceConflict
      }
    })

  } catch (error) {
    console.error('Error checking availability:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error checking availability' },
      { status: 500 }
    )
  }
}