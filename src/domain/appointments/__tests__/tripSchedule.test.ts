import { normalizeTripSchedule } from '../tripSchedule'

describe('normalizeTripSchedule', () => {
  const scheduledAt = new Date('2026-10-26T14:00:00.000Z')

  it('elimina el regreso y su desplazamiento en un viaje sencillo', () => {
    const result = normalizeTripSchedule({
      tripType: 'SENCILLO',
      scheduledAt,
      returnAt: new Date('2026-10-26T17:00:00.000Z'),
      returnTravelMinutes: 30
    })

    expect(result).toEqual({
      valid: true,
      returnAt: null,
      returnTravelMinutes: null
    })
  })

  it('exige regreso para un viaje doble', () => {
    const result = normalizeTripSchedule({
      tripType: 'DOBLE',
      scheduledAt,
      returnAt: null,
      returnTravelMinutes: 30
    })

    expect(result).toEqual({
      valid: false,
      error: 'La hora de regreso es obligatoria para un viaje de ida y regreso'
    })
  })

  it('rechaza una hora de regreso igual a la hora de ida', () => {
    const result = normalizeTripSchedule({
      tripType: 'DOBLE',
      scheduledAt,
      returnAt: new Date(scheduledAt),
      returnTravelMinutes: 30
    })

    expect(result.valid).toBe(false)
  })

  it('rechaza una hora de regreso anterior a la ida', () => {
    const result = normalizeTripSchedule({
      tripType: 'DOBLE',
      scheduledAt,
      returnAt: new Date('2026-10-26T13:59:00.000Z'),
      returnTravelMinutes: 30
    })

    expect(result).toEqual({
      valid: false,
      error: 'La hora de regreso debe ser posterior a la hora de ida'
    })
  })

  it('rechaza una hora de regreso inválida', () => {
    const result = normalizeTripSchedule({
      tripType: 'DOBLE',
      scheduledAt,
      returnAt: new Date('invalid'),
      returnTravelMinutes: 30
    })

    expect(result).toEqual({
      valid: false,
      error: 'La hora de regreso no es válida'
    })
  })

  it('conserva un regreso válido y su desplazamiento', () => {
    const returnAt = new Date('2026-10-26T17:00:00.000Z')
    const result = normalizeTripSchedule({
      tripType: 'DOBLE',
      scheduledAt,
      returnAt,
      returnTravelMinutes: 45
    })

    expect(result).toEqual({
      valid: true,
      returnAt,
      returnTravelMinutes: 45
    })
  })

  it('rechaza una fecha de ida inválida', () => {
    const result = normalizeTripSchedule({
      tripType: 'SENCILLO',
      scheduledAt: new Date('invalid'),
      returnAt: null
    })

    expect(result).toEqual({
      valid: false,
      error: 'La fecha y hora de ida no son válidas'
    })
  })
})
