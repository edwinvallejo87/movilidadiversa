import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const SurchargeConditionSchema = z.object({
  timeRanges: z.array(z.object({
    start: z.string(),
    end: z.string()
  })).optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  holidays: z.boolean().optional()
})

const UpdateSurchargeSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['TIME_BASED', 'DISTANCE_BASED', 'EXTRA_SERVICE']).optional(),
  amount: z.number().min(0).optional(),
  amountType: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  conditions: SurchargeConditionSchema.nullable().optional(),
  isActive: z.boolean().optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const surchargeData = UpdateSurchargeSchema.parse(body)

    const existingSurcharge = await db.surchargeRule.findUnique({
      where: { id }
    })

    if (!existingSurcharge) {
      return NextResponse.json(
        { error: 'Surcharge not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the SurchargeRule model
    const dbData: any = {}
    if (surchargeData.name !== undefined) dbData.name = surchargeData.name
    if (surchargeData.type !== undefined) dbData.type = surchargeData.type
    if (surchargeData.amountType !== undefined) dbData.amountType = surchargeData.amountType
    if (surchargeData.amount !== undefined) dbData.amount = surchargeData.amount
    if (surchargeData.conditions !== undefined) {
      dbData.conditionJson = surchargeData.conditions ? JSON.stringify(surchargeData.conditions) : null
    }
    if (surchargeData.isActive !== undefined) dbData.isActive = surchargeData.isActive

    const surcharge = await db.surchargeRule.update({
      where: { id },
      data: dbData
    })

    return NextResponse.json(surcharge)
  } catch (error) {
    console.error('Error updating surcharge:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error updating surcharge' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const existingSurcharge = await db.surchargeRule.findUnique({
      where: { id }
    })

    if (!existingSurcharge) {
      return NextResponse.json(
        { error: 'Surcharge not found' },
        { status: 404 }
      )
    }

    await db.surchargeRule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting surcharge:', error)
    return NextResponse.json(
      { error: 'Error deleting surcharge' },
      { status: 500 }
    )
  }
}