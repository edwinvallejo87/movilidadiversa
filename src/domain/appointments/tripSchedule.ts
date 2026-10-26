export type AppointmentTripType = 'SENCILLO' | 'DOBLE'

interface TripScheduleInput {
  tripType: AppointmentTripType
  scheduledAt: Date
  returnAt: Date | null
  returnTravelMinutes?: number | null
}

type TripScheduleResult =
  | {
      valid: true
      returnAt: Date | null
      returnTravelMinutes: number | null
    }
  | {
      valid: false
      error: string
    }

export function normalizeTripSchedule({
  tripType,
  scheduledAt,
  returnAt,
  returnTravelMinutes
}: TripScheduleInput): TripScheduleResult {
  if (Number.isNaN(scheduledAt.getTime())) {
    return { valid: false, error: 'La fecha y hora de ida no son válidas' }
  }

  if (tripType === 'SENCILLO') {
    return {
      valid: true,
      returnAt: null,
      returnTravelMinutes: null
    }
  }

  if (!returnAt) {
    return {
      valid: false,
      error: 'La hora de regreso es obligatoria para un viaje de ida y regreso'
    }
  }

  if (Number.isNaN(returnAt.getTime())) {
    return { valid: false, error: 'La hora de regreso no es válida' }
  }

  if (returnAt <= scheduledAt) {
    return {
      valid: false,
      error: 'La hora de regreso debe ser posterior a la hora de ida'
    }
  }

  return {
    valid: true,
    returnAt,
    returnTravelMinutes: returnTravelMinutes ?? null
  }
}
