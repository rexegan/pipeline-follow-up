import { useEffect, useState } from 'react'

/**
 * Milliseconds since `startAt`, ticking every second — like the Trade
 * Blotter's running clock on an open position. Stops ticking once `frozen`
 * is true, so a funded opportunity's clock stays put at whatever it read
 * when it finished instead of continuing to run.
 */
export function useElapsedMs(startAt: string, frozen: boolean): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (frozen) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [frozen])

  return Math.max(0, now - new Date(startAt).getTime())
}

/** Formats milliseconds as "3d 04:12:07" — days, then zero-padded H:M:S. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
