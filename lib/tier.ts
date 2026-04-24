import { Tier } from './types'

export function calcTier(score: number, allScores: number[]): Tier {
  if (allScores.length < 4) return null
  const sorted = [...allScores].sort((a, b) => b - a)
  const rank = sorted.indexOf(score)
  const percentile = rank / sorted.length

  if (percentile < 0.1) return 'S+'
  if (percentile < 0.25) return 'S'
  if (percentile < 0.5) return 'A'
  if (percentile < 0.75) return 'B'
  return 'C'
}

export function calcBentoScore(sideDishTotals: number[]): number {
  return sideDishTotals.reduce((sum, t) => sum + t, 0)
}

export const TIER_COLORS: Record<NonNullable<Tier>, string> = {
  'S+': 'tier-splus',
  'S': 'tier-s',
  'A': 'tier-a',
  'B': 'tier-b',
  'C': 'tier-c',
}
