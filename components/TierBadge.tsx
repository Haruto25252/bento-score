import { Tier } from '@/lib/types'
import { TIER_COLORS } from '@/lib/tier'

interface Props {
  tier: Tier
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 min-w-[2rem]',
  md: 'text-sm px-2 py-0.5 min-w-[2.5rem]',
  lg: 'text-base px-3 py-1 min-w-[3rem]',
}

export default function TierBadge({ tier, size = 'md' }: Props) {
  if (!tier) return null
  return (
    <span
      className={`inline-flex items-center justify-center rounded font-bold ${sizeClasses[size]} ${TIER_COLORS[tier as NonNullable<Tier>]}`}
    >
      {tier}
    </span>
  )
}
