import moment from 'moment'
import { ArrowRight, Car, Check, Undo2 } from 'lucide-react'

export interface CalendarEventCardData {
  title?: React.ReactNode
  start?: Date
  end?: Date
  customerName: string
  staffName?: string
  equipmentLabel: string
  returnAt?: Date | null
  status?: string
  travelMinutes?: number
  travelStripPx?: number
}

// Height of one hour in the week/day grid; keep in sync with .calendar-grid .rbc-timeslot-group in globals.css
export const HOUR_HEIGHT_PX = 88

// Card for drivers without an assigned color / unassigned appointments
export const UNASSIGNED_COLOR = '#6B7280'

// Pale background + dark text + colored left stripe, all in the assigned driver's color.
// Cancelled appointments are red regardless of driver; completed ones keep the driver color (the card shows a check).
// `start` is the block start (pickup minus travel time); `travelStripPx` is the height of the travel strip drawn on top.
export function getEventCardStyle(status: string, staffColor?: string, start?: Date, end?: Date, travelStripPx = 0): React.CSSProperties {
  const accent = staffColor || UNASSIGNED_COLOR
  let palette = {
    backgroundColor: `color-mix(in srgb, ${accent} 16%, white)`,
    color: '#1F2937',
    edge: `color-mix(in srgb, ${accent} 45%, white)`,
    stripe: accent
  }
  if (status === 'CANCELLED') {
    palette = { backgroundColor: '#FEE2E2', color: '#7F1D1D', edge: '#FCA5A5', stripe: '#EF4444' }
  }

  const hours = start && end ? (end.getTime() - start.getTime()) / 3600000 : 0

  return {
    // lets the hovered card grow to fit its content without shrinking below its time block
    ['--card-h' as string]: `${Math.round(hours * HOUR_HEIGHT_PX)}px`,
    backgroundColor: palette.backgroundColor,
    // hatched strip on top = vehicle travel time before the pickup
    backgroundImage: travelStripPx > 0
      ? `repeating-linear-gradient(135deg, ${palette.edge} 0 2px, transparent 2px 7px), linear-gradient(white, white)`
      : undefined,
    backgroundSize: travelStripPx > 0 ? `100% ${travelStripPx}px` : undefined,
    backgroundRepeat: 'no-repeat',
    color: palette.color,
    border: `1px solid ${palette.edge}`,
    borderLeft: `4px solid ${palette.stripe}`,
    borderRadius: '3px',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '500'
  }
}

// Hidden when the card is too narrow (several appointments side by side)
const WIDE_ONLY = '[@container_(max-width:84px)]:hidden'

// Week/day card: times on top (replaces the default label), customer as the main line, vehicle + driver below
export function TimeGridEventCard({ event }: { event: CalendarEventCardData }) {
  const start = moment(event.start).format('HH:mm')
  return (
    <div className="[container-type:inline-size]">
      {!!event.travelStripPx && (
        // spacer over the hatched travel strip (card has 2px top padding)
        <div className="flex items-center gap-1 text-[10px] font-normal opacity-80 overflow-hidden" style={{ height: Math.max(event.travelStripPx - 2, 0) }}>
          {event.travelStripPx >= 16 && (
            <>
              <Car className="w-3 h-3 shrink-0" />
              <span className="whitespace-nowrap">{event.travelMinutes} min</span>
            </>
          )}
        </div>
      )}
      <div className="flex flex-col gap-0.5 leading-tight break-normal">
        <div className="flex flex-wrap items-center gap-x-2 text-[11px] font-normal">
          {event.returnAt ? (
            <>
              <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                <ArrowRight className="w-3 h-3 shrink-0" />
                <span className={WIDE_ONLY}>Ida</span>
                <span className="font-semibold">{start}</span>
              </span>
              <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                <Undo2 className="w-3 h-3 shrink-0" />
                <span className={WIDE_ONLY}>Regreso</span>
                <span className="font-semibold">{moment(event.returnAt).format('HH:mm')}</span>
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
              <ArrowRight className="w-3 h-3 shrink-0" />
              <span className={WIDE_ONLY}>Ida</span>
              <span className="font-semibold">{start}</span>
            </span>
          )}
        </div>
        <div className="text-xs font-semibold">
          {event.status === 'COMPLETED' && <Check className="inline w-3 h-3 mr-0.5 -mt-0.5 text-green-700" strokeWidth={3} />}
          {event.customerName}
        </div>
        <div className={`text-[11px] font-normal opacity-80 ${WIDE_ONLY}`}>
          {event.equipmentLabel} · {event.staffName || 'Sin asignar'}
        </div>
      </div>
    </div>
  )
}

// Month/agenda: single line, return time appended for round trips
export function CompactEventCard({ event }: { event: CalendarEventCardData }) {
  return (
    <span>
      {event.title}
      {event.returnAt && ` · Regreso ${moment(event.returnAt).format('HH:mm')}`}
    </span>
  )
}
