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

const CreateSurchargeSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['TIME_BASED', 'DISTANCE_BASED', 'EXTRA_SERVICE']),
  amount: z.number().min(0),
  amountType: z.enum(['FIXED', 'PERCENTAGE']),
  conditions: SurchargeConditionSchema.nullable().optional(),
  isActive: z.boolean().default(true)
})

export async function GET() {
  try {
    const surcharges = await db.surchargeRule.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(surcharges)
  } catch (error) {
    console.error('Error fetching surcharges:', error)
    return NextResponse.json(
      { error: 'Error fetching surcharges' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const surchargeData = CreateSurchargeSchema.parse(body)

    // Transform the data to match the SurchargeRule model
    const dbData = {
      name: surchargeData.name,
      type: surchargeData.type,
      amountType: surchargeData.amountType,
      amount: surchargeData.amount,
      conditionJson: surchargeData.conditions ? JSON.stringify(surchargeData.conditions) : null,
      isActive: surchargeData.isActive
    }

    const surcharge = await db.surchargeRule.create({
      data: dbData
    })

    return NextResponse.json(surcharge, { status: 201 })
  } catch (error) {
    console.error('Error creating surcharge:', error)
    
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
      { error: 'Error creating surcharge' },
      { status: 500 }
    )
  }
}