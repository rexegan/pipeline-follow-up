import type { Horizon } from '../../types'
import { endOfMonth, endOfWeek, today } from '../../lib/dates'

/** The due date a commitment window implies when nothing has been set by hand. */
export const defaultDue = (horizon: Horizon): string =>
  horizon === 'today' ? today() : horizon === 'week' ? endOfWeek() : endOfMonth()
