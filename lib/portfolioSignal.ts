// The delivery signal: a calculated second opinion, shown beside the
// Engagement Status but never merged with it. Built only from data already
// in the portal (no Jira ticket integration yet, so that term is omitted).
//
// Mirrors the model from Jon's PS Portal package (app/src/lib/signal.ts),
// minus the "open critical ticket" term.

export type SignalLevel = 'green' | 'amber' | 'red'

export type Signal = {
  level: SignalLevel
  score: number
  label: string
  reasons: string[]
}

export type SignalInput = {
  pctComplete: number | null
  contractSignedDate: string | null
  lastTimeEntryDate: string | null
  servicesBacklog: number | null
  epic: string | null
}

export const STALE_DAYS = 90

export function daysSince(dateStr: string | null | undefined, today: string): number | null {
  if (!dateStr) return null
  return Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${dateStr}T12:00:00`).getTime()) / 86_400_000)
}

export function signalFor(p: SignalInput, today: string): Signal {
  const reasons: string[] = []
  let score = 100
  const backlog = p.servicesBacklog ?? 0
  const hasBacklog = backlog > 0
  const days = daysSince(p.lastTimeEntryDate, today)

  if (hasBacklog && days === null) {
    score -= 35
    reasons.push('Backlog remaining and no time entry ever recorded')
  } else if (hasBacklog && days !== null && days > 180) {
    score -= 30
    reasons.push(`No time entry in ${days} days`)
  } else if (hasBacklog && days !== null && days > STALE_DAYS) {
    score -= 20
    reasons.push(`No time entry in ${days} days`)
  } else if (hasBacklog && days !== null && days > 30) {
    score -= 10
    reasons.push(`No time entry in ${days} days`)
  }

  if (hasBacklog && p.pctComplete !== null && p.pctComplete >= 99.9) {
    score -= 10
    reasons.push('Reported complete with backlog still on the books')
  }
  if (backlog < 0) {
    score -= 25
    reasons.push('Negative backlog, billed past the contract value')
  }

  const signedAge = daysSince(p.contractSignedDate, today)
  if (hasBacklog && signedAge !== null && signedAge > 730 && (p.pctComplete === null || p.pctComplete < 50)) {
    score -= 15
    reasons.push('Signed over two years ago and less than half complete')
  }

  if (hasBacklog && backlog > 25_000 && !p.epic) {
    score -= 5
    reasons.push('No Jira epic linked')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const level: SignalLevel = score >= 75 ? 'green' : score >= 50 ? 'amber' : 'red'
  if (!reasons.length) reasons.push(hasBacklog ? 'Billing recently, nothing flagged' : 'No backlog remaining')
  return {
    level,
    score,
    reasons,
    label: level === 'green' ? 'Moving' : level === 'amber' ? 'Watch' : 'Needs a push',
  }
}

export function isStale(lastTimeEntryDate: string | null, servicesBacklog: number | null, today: string): boolean {
  const days = daysSince(lastTimeEntryDate, today)
  const backlog = servicesBacklog ?? 0
  return (days === null || days > STALE_DAYS) && backlog > 0
}

export const ENGAGEMENT_STATUSES: { key: string; label: string; description: string }[] = [
  { key: 'GREEN', label: 'Full throttle', description: 'Actively billing, engaged customer, moving at pace' },
  { key: 'YELLOW', label: 'Slow burn', description: 'Engaged and billing, slower than we want' },
  { key: 'RED', label: 'Stalled', description: 'Activities defined but on hold' },
  { key: 'BLUE', label: 'Go-get', description: 'Needs customer approval before we can work' },
  { key: 'GREY', label: 'Disengaged', description: 'Being ghosted, no recent communication' },
  { key: 'OPEN', label: 'Unclassified', description: 'New, not triaged yet' },
]
